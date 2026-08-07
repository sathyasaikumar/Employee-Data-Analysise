// Authentication Utility Module

const STORAGE_KEY = 'corporate_auth_user';
const REGISTERED_USERS_KEY = 'corporate_registered_users';

export const DEMO_ACCOUNTS = {
  email: {
    identifier: 'admin@corporate.com',
    password: '123456',
    name: 'Alex Morgan',
    role: 'Senior Data Lead',
    avatar: 'AM',
    type: 'email'
  },
  phone: {
    countryCode: '+1',
    number: '9876543210',
    fullPhone: '+1 9876543210',
    otp: '654321',
    name: 'Sarah Jenkins',
    role: 'Workforce Manager',
    avatar: 'SJ',
    type: 'phone'
  }
};

export const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read registered users:', err);
    return [];
  }
};

const saveRegisteredUser = (user) => {
  try {
    const users = getRegisteredUsers();
    users.push(user);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save registered user:', err);
  }
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePhone = (phone) => {
  const cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
  return /^\+?[0-9]{10,15}$/.test(cleaned);
};

export const registerWithEmail = async ({ name, email, role, password }) => {
  const cleanName = name ? name.trim() : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  if (!cleanName) {
    throw new Error('Please enter your full name.');
  }

  if (!cleanEmail || !validateEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address format (e.g. user@company.com).');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  // Check if account already exists
  const registered = getRegisteredUsers();
  const existing = registered.find(u => u.email === cleanEmail) || (cleanEmail === DEMO_ACCOUNTS.email.identifier);
  if (existing) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const initials = cleanName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';

  const newUser = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    email: cleanEmail,
    role: role || 'Authorized Analyst',
    avatar: initials,
    password: password,
    loginType: 'email',
    loginTime: new Date().toISOString()
  };

  saveRegisteredUser(newUser);
  
  // Exclude password from session user object
  const sessionUser = { ...newUser };
  delete sessionUser.password;
  setStoredUser(sessionUser);

  return sessionUser;
};

export const registerWithPhone = async ({ name, countryCode, phone, role, otp }) => {
  const cleanName = name ? name.trim() : '';
  const cleanNum = String(phone).replace(/\D/g, '');
  const fullPhone = `${countryCode} ${cleanNum}`;

  if (!cleanName) {
    throw new Error('Please enter your full name.');
  }

  if (!cleanNum || cleanNum.length < 7 || cleanNum.length > 15) {
    throw new Error('Please enter a valid 10-digit mobile phone number.');
  }

  if (!otp || otp.trim().length === 0) {
    throw new Error('Please enter the verification OTP code.');
  }

  // Check if account already exists
  const registered = getRegisteredUsers();
  const existing = registered.find(u => u.phone === fullPhone || u.phoneClean === cleanNum) || (cleanNum === DEMO_ACCOUNTS.phone.number);
  if (existing) {
    throw new Error('An account with this mobile phone number already exists. Please sign in instead.');
  }

  const initials = cleanName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MB';

  const newUser = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    phone: fullPhone,
    phoneClean: cleanNum,
    role: role || 'Verified Mobile User',
    avatar: initials,
    loginType: 'phone',
    loginTime: new Date().toISOString()
  };

  saveRegisteredUser(newUser);
  setStoredUser(newUser);

  return newUser;
};

export const loginWithEmail = async (email, password) => {
  const cleanEmail = email.trim().toLowerCase();
  
  if (!cleanEmail) {
    throw new Error('Please enter an email address.');
  }

  if (!validateEmail(cleanEmail)) {
    throw new Error('Please enter a valid email address format (e.g. user@company.com).');
  }

  if (!password) {
    throw new Error('Please enter your password or verification code.');
  }

  // Check registered users first
  const registered = getRegisteredUsers();
  const matchedUser = registered.find(u => u.email === cleanEmail);

  if (matchedUser) {
    if (matchedUser.password && matchedUser.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }
    const sessionUser = { ...matchedUser };
    delete sessionUser.password;
    setStoredUser(sessionUser);
    return sessionUser;
  }

  // Check demo credentials
  if (cleanEmail === DEMO_ACCOUNTS.email.identifier) {
    if (password !== DEMO_ACCOUNTS.email.password) {
      throw new Error('Invalid password. Demo password is: 123456');
    }
    const user = {
      id: 'usr_demo_email',
      name: DEMO_ACCOUNTS.email.name,
      email: cleanEmail,
      role: DEMO_ACCOUNTS.email.role,
      avatar: DEMO_ACCOUNTS.email.avatar,
      loginType: 'email',
      loginTime: new Date().toISOString()
    };
    setStoredUser(user);
    return user;
  }

  // Default authentication for custom email addresses
  const user = {
    id: `usr_${Date.now()}`,
    name: cleanEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
    email: cleanEmail,
    role: 'Authorized Analyst',
    avatar: cleanEmail.substring(0, 2).toUpperCase(),
    loginType: 'email',
    loginTime: new Date().toISOString()
  };

  setStoredUser(user);
  return user;
};

export const loginWithPhone = async (countryCode, phone, otp) => {
  const cleanNum = String(phone).replace(/\D/g, '');
  const fullPhone = `${countryCode} ${cleanNum}`;

  if (!cleanNum) {
    throw new Error('Please enter your phone number.');
  }

  if (cleanNum.length < 7 || cleanNum.length > 15) {
    throw new Error('Please enter a valid 10-digit mobile phone number.');
  }

  if (!otp || otp.trim().length === 0) {
    throw new Error('Please enter the 6-digit OTP code sent to your phone.');
  }

  // Check registered users
  const registered = getRegisteredUsers();
  const matchedUser = registered.find(u => u.phoneClean === cleanNum || u.phone === fullPhone);
  if (matchedUser) {
    setStoredUser(matchedUser);
    return matchedUser;
  }

  // Check demo phone
  if (cleanNum === DEMO_ACCOUNTS.phone.number) {
    if (otp !== DEMO_ACCOUNTS.phone.otp) {
      throw new Error('Invalid OTP code. Demo OTP is: 654321');
    }
    const user = {
      id: 'usr_demo_phone',
      name: DEMO_ACCOUNTS.phone.name,
      phone: fullPhone,
      role: DEMO_ACCOUNTS.phone.role,
      avatar: DEMO_ACCOUNTS.phone.avatar,
      loginType: 'phone',
      loginTime: new Date().toISOString()
    };
    setStoredUser(user);
    return user;
  }

  // Default authentication for custom phone numbers
  const user = {
    id: `usr_${Date.now()}`,
    name: `User ${cleanNum.slice(-4)}`,
    phone: fullPhone,
    role: 'Verified Mobile User',
    avatar: 'MB',
    loginType: 'phone',
    loginTime: new Date().toISOString()
  };

  setStoredUser(user);
  return user;
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read stored user session:', err);
    return null;
  }
};

export const setStoredUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user session:', err);
  }
};

export const logoutUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear user session:', err);
  }
};