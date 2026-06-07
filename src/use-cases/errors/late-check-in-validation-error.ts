export class LateCheckInValidationError extends Error {
	constructor() {
		super("Check-in can only be validated within 20 minutes of its creation.")
		this.name = "LateCheckInValidationError"
	}
}
