import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.empty': 'Email es obligatorio',
    'string.email': 'Email debe ser válido',
  }),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Contraseña es obligatoria',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).required().messages({
    'string.empty': 'Contraseña actual es obligatoria',
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'Nueva contraseña debe tener mínimo 6 caracteres',
    'string.empty': 'Nueva contraseña es obligatoria',
  }),
});
