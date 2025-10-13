import { ERROR_MESSAGES, VALIDATION } from "../config.js";

export interface ValidationResult {
	isValid: boolean;
	errors: string[];
}

export class Validator {
	// Generic validation methods
	static required(value: any, fieldName: string): string | null {
		if (value === null || value === undefined || value === "") {
			return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD(fieldName);
		}
		return null;
	}

	static maxLength(value: string, maxLength: number, fieldName: string): string | null {
		if (value && value.length > maxLength) {
			return ERROR_MESSAGES.VALIDATION.TOO_LONG(fieldName, maxLength);
		}
		return null;
	}

	static minLength(value: string, minLength: number, fieldName: string): string | null {
		if (value && value.length < minLength) {
			return ERROR_MESSAGES.VALIDATION.TOO_SHORT(fieldName, minLength);
		}
		return null;
	}

	static range(value: number, min: number, max: number, fieldName: string): string | null {
		if (value < min || value > max) {
			return ERROR_MESSAGES.VALIDATION.INVALID_RANGE(fieldName, min, max);
		}
		return null;
	}

	static email(value: string): string | null {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (value && !emailRegex.test(value)) {
			return ERROR_MESSAGES.VALIDATION.INVALID_FORMAT("email");
		}
		return null;
	}

	static phone(value: string): string | null {
		const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
		if (value && !phoneRegex.test(value.replace(/[\s\-\(\)]/g, ""))) {
			return ERROR_MESSAGES.VALIDATION.INVALID_FORMAT("phone");
		}
		return null;
	}

	static date(value: string): string | null {
		if (value) {
			const date = new Date(value);
			if (isNaN(date.getTime())) {
				return ERROR_MESSAGES.VALIDATION.INVALID_FORMAT("date");
			}
		}
		return null;
	}

	static positiveNumber(value: number, fieldName: string): string | null {
		if (value !== undefined && value < 0) {
			return `${fieldName} must be a positive number`;
		}
		return null;
	}

	static integer(value: number, fieldName: string): string | null {
		if (value !== undefined && !Number.isInteger(value)) {
			return `${fieldName} must be an integer`;
		}
		return null;
	}

	// Medicine validation
	static validateMedicine(data: any): ValidationResult {
		const errors: string[] = [];

		// Required fields
		const requiredFields = ["name"];
		requiredFields.forEach((field) => {
			const error = this.required(data[field], field);
			if (error) errors.push(error);
		});

		// Length validations
		if (data.name) {
			const error = this.maxLength(data.name, VALIDATION.MEDICINE.NAME_MAX_LENGTH, "name");
			if (error) errors.push(error);
		}

		if (data.description) {
			const error = this.maxLength(data.description, VALIDATION.MEDICINE.DESCRIPTION_MAX_LENGTH, "description");
			if (error) errors.push(error);
		}

		if (data.strength) {
			const error = this.maxLength(data.strength, VALIDATION.MEDICINE.STRENGTH_MAX_LENGTH, "strength");
			if (error) errors.push(error);
		}

		if (data.manufacturer) {
			const error = this.maxLength(data.manufacturer, VALIDATION.MEDICINE.MANUFACTURER_MAX_LENGTH, "manufacturer");
			if (error) errors.push(error);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	// Supplier validation
	static validateSupplier(data: any): ValidationResult {
		const errors: string[] = [];

		// Required fields
		const error = this.required(data.name, "name");
		if (error) errors.push(error);

		// Length validations
		if (data.name) {
			const error = this.maxLength(data.name, VALIDATION.SUPPLIER.NAME_MAX_LENGTH, "name");
			if (error) errors.push(error);
		}

		if (data.contact_person) {
			const error = this.maxLength(
				data.contact_person,
				VALIDATION.SUPPLIER.CONTACT_PERSON_MAX_LENGTH,
				"contact_person",
			);
			if (error) errors.push(error);
		}

		if (data.phone) {
			const phoneError = this.phone(data.phone);
			if (phoneError) errors.push(phoneError);

			const lengthError = this.maxLength(data.phone, VALIDATION.SUPPLIER.PHONE_MAX_LENGTH, "phone");
			if (lengthError) errors.push(lengthError);
		}

		if (data.email) {
			const emailError = this.email(data.email);
			if (emailError) errors.push(emailError);

			const lengthError = this.maxLength(data.email, VALIDATION.SUPPLIER.EMAIL_MAX_LENGTH, "email");
			if (lengthError) errors.push(lengthError);
		}

		if (data.address) {
			const error = this.maxLength(data.address, VALIDATION.SUPPLIER.ADDRESS_MAX_LENGTH, "address");
			if (error) errors.push(error);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	// Batch validation
	static validateBatch(data: any): ValidationResult {
		const errors: string[] = [];

		// Required fields
		const requiredFields = ["batch_number", "quantity", "cost_price", "selling_price", "expiry_date"];
		requiredFields.forEach((field) => {
			const error = this.required(data[field], field);
			if (error) errors.push(error);
		});

		// Numeric validations
		if (data.quantity !== undefined) {
			const intError = this.integer(data.quantity, "quantity");
			if (intError) errors.push(intError);

			const rangeError = this.range(
				data.quantity,
				VALIDATION.BATCH.MIN_QUANTITY,
				VALIDATION.BATCH.MAX_QUANTITY,
				"quantity",
			);
			if (rangeError) errors.push(rangeError);
		}

		if (data.cost_price !== undefined) {
			const positiveError = this.positiveNumber(data.cost_price, "cost_price");
			if (positiveError) errors.push(positiveError);

			const rangeError = this.range(
				data.cost_price,
				VALIDATION.BATCH.MIN_PRICE,
				VALIDATION.BATCH.MAX_PRICE,
				"cost_price",
			);
			if (rangeError) errors.push(rangeError);
		}

		if (data.selling_price !== undefined) {
			const positiveError = this.positiveNumber(data.selling_price, "selling_price");
			if (positiveError) errors.push(positiveError);

			const rangeError = this.range(
				data.selling_price,
				VALIDATION.BATCH.MIN_PRICE,
				VALIDATION.BATCH.MAX_PRICE,
				"selling_price",
			);
			if (rangeError) errors.push(rangeError);
		}

		// Date validation
		if (data.expiry_date) {
			const dateError = this.date(data.expiry_date);
			if (dateError) errors.push(dateError);
		}

		if (data.manufacturing_date) {
			const dateError = this.date(data.manufacturing_date);
			if (dateError) errors.push(dateError);
		}

		// Length validations
		if (data.batch_number) {
			const error = this.maxLength(data.batch_number, VALIDATION.BATCH.BATCH_NUMBER_MAX_LENGTH, "batch_number");
			if (error) errors.push(error);
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	// File validation
	static validateFile(file: any): ValidationResult {
		const errors: string[] = [];

		if (!file) {
			errors.push("File is required");
			return { isValid: false, errors };
		}

		// File size validation
		if (file.size > 10 * 1024 * 1024) {
			// 10MB
			errors.push(ERROR_MESSAGES.FILE.TOO_LARGE);
		}

		// File type validation
		const allowedTypes = ["text/csv", "application/json"];
		if (!allowedTypes.includes(file.type)) {
			errors.push(ERROR_MESSAGES.FILE.INVALID_TYPE);
		}

		// Filename validation
		if (file.name && file.name.length > VALIDATION.FILE.MAX_FILENAME_LENGTH) {
			errors.push(ERROR_MESSAGES.VALIDATION.TOO_LONG("filename", VALIDATION.FILE.MAX_FILENAME_LENGTH));
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	// Pagination validation
	static validatePagination(page?: string, limit?: string): ValidationResult {
		const errors: string[] = [];

		if (page) {
			const pageNum = parseInt(page);
			if (isNaN(pageNum) || pageNum < 1) {
				errors.push("Page must be a positive integer");
			}
		}

		if (limit) {
			const limitNum = parseInt(limit);
			if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
				errors.push("Limit must be between 1 and 100");
			}
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}
}
