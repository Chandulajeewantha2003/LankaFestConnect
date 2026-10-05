import { Equals, IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { ROLES, UserRole } from '../users/user.schema';
import { Transform } from 'class-transformer';
export class RegisterDto {
 @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
 @IsString() @MinLength(2) @MaxLength(100) fullName!: string;
 @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
 @IsEmail() @MaxLength(254) email!: string;
 @IsString() @MinLength(8) @MaxLength(128) password!: string;
 @Equals(true) acceptTerms!: boolean;
}
export class LoginDto {
 @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
 @IsEmail() email!: string;
 @IsString() @MinLength(1) @MaxLength(128) password!: string;
}
export class RoleDto { @IsIn(ROLES) role!: UserRole; }
