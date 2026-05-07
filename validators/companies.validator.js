import Joi from 'joi';

export const createCompanySchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    'string.min': 'Nombre debe tener mínimo 2 caracteres',
    'string.empty': 'Nombre es obligatorio',
  }),
  rut: Joi.string().optional(),
  planName: Joi.string().optional(),
  userLimit: Joi.number().optional(),
  storageLimitGb: Joi.number().optional(),
  adminFullName: Joi.string().min(2).required().messages({
    'string.min': 'Nombre del admin debe tener mínimo 2 caracteres',
    'string.empty': 'Nombre del admin es obligatorio',
  }),
  adminEmail: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Email del admin debe ser válido',
    'string.empty': 'Email del admin es obligatorio',
  }),
  adminPassword: Joi.string().min(6).required().messages({
    'string.min': 'Contraseña del admin debe tener mínimo 6 caracteres',
    'string.empty': 'Contraseña del admin es obligatoria',
  }),
}).unknown(false);

export const suspendCompanySchema = Joi.object({
  reason: Joi.string().optional(),
}).unknown(false);
