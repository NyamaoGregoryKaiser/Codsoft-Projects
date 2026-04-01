import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AppDataSource } from '../config/database';
import { EntitySchema, ObjectLiteral } from 'typeorm';

@ValidatorConstraint({ async: true })
export class IsUniqueConstraint implements ValidatorConstraintInterface {
  async validate(value: any, args: ValidationArguments) {
    const [entityClass, property] = args.constraints;
    const repository = AppDataSource.getRepository(entityClass);
    const existing = await repository.findOne({ where: { [property]: value } });
    return existing === null;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} '${args.value}' already exists.`;
  }
}

export function IsUnique<T extends ObjectLiteral>(
  entity: new () => T | EntitySchema<T>,
  property: keyof T,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [entity, property],
      validator: IsUniqueConstraint,
    });
  };
}