import Joi, { type ObjectSchema } from "joi";
import type { IRegistration, ILogin } from "@src/types";

export const registrationSchema: ObjectSchema<IRegistration> = Joi.object({
    fullname: Joi.string().pattern(/^[a-zA-Z0-9 ]+$/).min(1).max(50).required().messages({
        "string.base": "fullname should be a string",
        "string.empty": "fullname should not be empty",
        "string.pattern.base": "fullname should only contain alphanumeric characters and spaces",
        "string.min": "fullname length must be at least {#limit} characters",
        "string.max": "fullname length must be at most {#limit} characters",
        "any.required": "fullname is required",
    }),

    handle: Joi.string().alphanum().min(3).max(20).required().messages({
        "string.base": "handle should be a string",
        "string.empty": "handle should not be empty",
        "string.alphanum": "handle should only contain alphanumeric characters",
        "string.min": "handle length must be at least {#limit} characters",
        "string.max": "handle length must be at most {#limit} characters",
        "any.required": "handle is required",
    }),

    email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .min(5)
        .max(100)
        .required()
        .messages({
            "string.base": "email should be a valid email address",
            "string.empty": "email should not be empty",
            "string.email": "email should be a valid email address",
            "string.min": "email length must be at least {#limit} characters",
            "string.max": "email length must be at most {#limit} characters",
            "any.required": "email is required",
        }),

    password: Joi.string().min(4).max(20).required().messages({
        "string.base": "password should be a string",
        "string.empty": "password should not be empty",
        "string.min": "password length must be at least {#limit} characters",
        "string.max": "password length must be at most {#limit} characters",
        "any.required": "password is required",
    }),
});

export const loginSchema: ObjectSchema<ILogin> = Joi.object({
    email: Joi.string()
        .email({ tlds: { allow: false } })
        .lowercase()
        .min(5)
        .max(100)
        .required()
        .messages({
            "string.base": "email should be a valid email address",
            "string.empty": "email should not be empty",
            "string.email": "email should be a valid email address",
            "string.min": "email length must be at least {#limit} characters",
            "string.max": "email length must be at most {#limit} characters",
            "any.required": "email is required",
        }),

    password: Joi.string().min(4).max(20).required().messages({
        "string.base": "password should be a string",
        "string.empty": "password should not be empty",
        "string.min": "password length must be at least {#limit} characters",
        "string.max": "password length must be at most {#limit} characters",
        "any.required": "password is required",
    }),
});
