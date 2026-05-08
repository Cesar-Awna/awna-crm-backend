import Joi from 'joi';

const VALID_ROLES = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'SUPERVISOR', 'EXECUTIVE'];

export const createUserSchema = Joi.object({
  fullName: Joi.string().min(2).required().messages({
    'string.min': 'Nombre completo debe tener mínimo 2 caracteres',
    'string.empty': 'Nombre completo es obligatorio',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Email debe ser válido',
    'string.empty': 'Email es obligatorio',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Contraseña debe tener mínimo 6 caracteres',
    'string.empty': 'Contraseña es obligatoria',
  }),
  roleName: Joi.string()
    .valid(...VALID_ROLES)
    .optional()
    .messages({
      'any.only': `Rol debe ser uno de: ${VALID_ROLES.join(', ')}`,
    }),
  businessUnitIds: Joi.array().items(Joi.string()).optional(),
  phone: Joi.string().optional(),
  supervisorId: Joi.string().allow(null).optional(),
}).unknown(false);

export const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).optional().messages({
    'string.min': 'Nombre completo debe tener mínimo 2 caracteres',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).optional().messages({
    'string.email': 'Email debe ser válido',
  }),
  roleName: Joi.string()
    .valid(...VALID_ROLES)
    .optional()
    .messages({
      'any.only': `Rol debe ser uno de: ${VALID_ROLES.join(', ')}`,
    }),
  businessUnitIds: Joi.array().items(Joi.string()).optional(),
  phone: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
  supervisorId: Joi.string().allow(null).optional(),
}).unknown(false);
