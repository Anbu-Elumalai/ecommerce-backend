/**
 * @swagger
 * components:
 *   schemas:
 *     LoginDto:
 *       type: object
 *       required:
 *         - phoneNumber
 *         - pin
 *       properties:
 *         phoneNumber:
 *           type: string
 *           example: "9876543210"
 *         pin:
 *           type: string
 *           example: "1234"
 *     ChangePinDto:
 *       type: object
 *       required:
 *         - oldPin
 *         - newPin
 *       properties:
 *         oldPin:
 *           type: string
 *           example: "1234"
 *         newPin:
 *           type: string
 *           example: "5678"
 */
import { IsString, IsNotEmpty, Length, Matches } from "class-validator";

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    @Length(10, 10, { message: "Phone number must be exactly 10 digits" })
    @Matches(/^\d{10}$/, { message: "Phone number must contain only digits" })
      phoneNumber!: string;

    @Length(4, 4, { message: "PIN must be exactly 4 digits" })
    @Matches(/^\d{4}$/, { message: "PIN must contain only digits" })
    @IsString()
    @IsNotEmpty()
      pin!: string;
}

export class ChangePinDto {
    @Length(4, 4)
    @IsString()
    @IsNotEmpty()
      oldPin!: string;

    @Length(4, 4)
    @IsString()
    @IsNotEmpty()
      newPin!: string;
}
