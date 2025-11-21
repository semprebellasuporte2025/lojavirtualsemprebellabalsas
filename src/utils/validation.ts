// Validações e máscaras comuns usadas no checkout

export const maskCPF = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14);
};

export const maskPhone = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);
};

export const maskCEP = (value: string): string => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 9);
};

export const unmask = (value: string): string => value.replace(/\D/g, '');

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const clean = unmask(phone);
  return clean.length === 11;
};

export const validateCEP = (cep: string): boolean => {
  const clean = unmask(cep);
  return clean.length === 8;
};

// Validação de CPF (algoritmo oficial)
export const validateCPF = (cpf: string): boolean => {
  const clean = unmask(cpf);
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(clean[i]) * (10 - i);
  let rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i]) * (11 - i);
  rev = (sum * 10) % 11;
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean[10])) return false;

  return true;
};

// Validação cartão (Luhn) opcional
export const validateCreditCard = (number: string): boolean => {
  const clean = unmask(number);
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let dbl = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let d = parseInt(clean[i]);
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
};

export const validateExpiryDate = (value: string): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [mm, yy] = value.split('/').map(Number);
  if (mm < 1 || mm > 12) return false;
  const now = new Date();
  const cYY = now.getFullYear() % 100;
  const cMM = now.getMonth() + 1;
  if (yy < cYY || (yy === cYY && mm < cMM)) return false;
  return true;
};

export const validateCVV = (cvv: string): boolean => /^\d{3,4}$/.test(cvv);