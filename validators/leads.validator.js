import Joi from 'joi';

const LEAD_STATUSES = ['NUEVO', 'DATO_ERRADO', 'CONTACTADO', 'INTERESADO', 'COTIZACION_ENVIADA', 'EN_SEGUIMIENTO', 'CERRADO_GANADO', 'CERRADO_PERDIDO'];

const ACTION_TYPES = ['LLAMADA', 'ENVIAR_INFO', 'REUNION', 'NOTA'];

export const createLeadSchema = Joi.object({
  ownerUserId: Joi.string().optional(),
  status: Joi.string()
    .valid(...LEAD_STATUSES)
    .optional()
    .messages({
      'any.only': `Status debe ser uno de: ${LEAD_STATUSES.join(', ')}`,
    }),
  razonSocial: Joi.string().optional(),
  rutEmpresa: Joi.string().optional(),
  contactName: Joi.string().optional(),
  contactEmail: Joi.string().email({ tlds: { allow: false } }).optional().messages({
    'string.email': 'Email de contacto debe ser válido',
  }),
  contactPhone: Joi.string().optional(),
  observation: Joi.string().optional(),
  nextContactDate: Joi.date().optional(),
  nextActionType: Joi.string()
    .valid(...ACTION_TYPES)
    .optional()
    .messages({
      'any.only': `Tipo de acción debe ser uno de: ${ACTION_TYPES.join(', ')}`,
    }),
  fields: Joi.object().optional(),
}).unknown(false);

export const changeStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...LEAD_STATUSES)
    .required()
    .messages({
      'any.only': `Status debe ser uno de: ${LEAD_STATUSES.join(', ')}`,
      'string.empty': 'Status es obligatorio',
    }),
}).unknown(false);

export const assignLeadSchema = Joi.object({
  ownerUserId: Joi.string().required().messages({
    'string.empty': 'ownerUserId es obligatorio',
  }),
}).unknown(false);

export const registerContactSchema = Joi.object({
  outcome: Joi.string().required().messages({
    'string.empty': 'outcome es obligatorio',
  }),
  notes: Joi.string().optional(),
}).unknown(false);

export const addNoteSchema = Joi.object({
  note: Joi.string().required().messages({
    'string.empty': 'note es obligatorio',
  }),
}).unknown(false);

export const logActivitySchema = Joi.object({
  eventType: Joi.string().required().messages({
    'string.empty': 'eventType es obligatorio',
  }),
  note: Joi.string().optional(),
  eventAt: Joi.date().optional(),
}).unknown(false);
