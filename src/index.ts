/**
 * Type safe schema for DynamoDB.
 * @module
 */

import type { AttributeValue, AttributeMap } from "aws-sdk/clients/dynamodb";
import * as marshaller from "@aws/dynamodb-data-marshaller";
// import {unmarshallItem, marshallValue} from "@aws/dynamodb-data-marshaller";

/**
 * Schema
 */
export abstract class Schema<T> {
  /** DO NOT ACCESS THIS!
   */
  readonly _I_AM_FOOL_ENOUGH_TO_ACCESS_THIS!: T;
  abstract serializeItem(): marshaller.SchemaType;
}

/**
 * Infer type of Schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type infer<S extends Schema<any>> =
  S["_I_AM_FOOL_ENOUGH_TO_ACCESS_THIS"];

class BinarySchema extends Schema<ArrayBuffer | ArrayBufferView> {
  constructor() {
    super();
  }
  public serializeItem(): marshaller.SchemaType {
    return { type: "Binary" };
  }
}

/**
 * Binary Schema
 */
export const buffer: () => Schema<ArrayBufferView | ArrayBuffer> = () =>
  new BinarySchema();

class BooleanSchema extends Schema<boolean> {
  constructor() {
    super();
  }
  public serializeItem(): marshaller.SchemaType {
    return { type: "Boolean" };
  }
}

/**
 * Boolean Schema
 */
export const boolean: () => Schema<boolean> = () => new BooleanSchema();

class DateSchema extends Schema<Date> {
  constructor() {
    super();
  }
  public serializeItem(): marshaller.SchemaType {
    return { type: "Date" };
  }
}

/**
 * Date Schema
 */
export const date: () => Schema<Date> = () => new DateSchema();

class NumberSchema extends Schema<number> {
  constructor() {
    super();
  }
  public serializeItem(): marshaller.SchemaType {
    return { type: "Number" };
  }
}

/**
 * Number Schema.
 */
export const number: () => Schema<number> = () => new NumberSchema();

class StringSchema extends Schema<string> {
  constructor() {
    super();
  }
  public serializeItem(): marshaller.SchemaType {
    return { type: "String" };
  }
}

/**
 * String Schema.
 */
export const string: () => Schema<string> = () => new StringSchema();

class ArraySchema<T> extends Schema<T[]> {
  readonly _schema!: Schema<T>;
  constructor(schema: Schema<T>) {
    super();
    this._schema = schema;
  }
  public serializeItem(): marshaller.SchemaType {
    return {
      type: "List",
      memberType: this._schema.serializeItem(),
    };
  }
}

/**
 * Array Schema
 */
export function array<T>(item: Schema<T>): Schema<T[]> {
  return new ArraySchema(item);
}

class MapSchema<T> extends Schema<Map<string, T>> {
  readonly _schema!: Schema<T>;
  constructor(schema: Schema<T>) {
    super();
    this._schema = schema;
  }
  public serializeItem(): marshaller.SchemaType {
    return {
      type: "Map",
      memberType: this._schema.serializeItem(),
    };
  }
}

/**
 * Map Schema
 */
export function map<T>(item: Schema<T>): Schema<Map<string, T>> {
  return new MapSchema(item);
}

class SetSchema<
  T extends ArrayBuffer | ArrayBufferView | number | string
> extends Schema<Set<T>> {
  readonly _schema!: Schema<T>;
  constructor(schema: Schema<T>) {
    super();
    this._schema = schema;
  }

  private memberType(): "String" | "Number" | "Binary" {
    if (this._schema instanceof BinarySchema) {
      return "Binary";
    }
    if (this._schema instanceof NumberSchema) {
      return "Number";
    }
    if (this._schema instanceof StringSchema) {
      return "String";
    }
    throw new Error("Invalid Set");
  }
  public serializeItem(): marshaller.SchemaType {
    return {
      type: "Set",
      memberType: this.memberType(),
    };
  }
}

/**
 * Set Schema
 */
export function set<T extends ArrayBuffer | ArrayBufferView | number | string>(
  item: Schema<T>
): Schema<Set<T>> {
  return new SetSchema(item);
}

class NullableSchema<T> extends Schema<T | null> {
  readonly _schema!: Schema<T>;
  constructor(schema: Schema<T>) {
    super();
    this._schema = schema;
  }

  private marshall(input: T | null): AttributeValue {
    if (input === null) {
      return {
        NULL: true,
      };
    }

    const serialized: AttributeValue | undefined = marshaller.marshallValue(
      this._schema.serializeItem(),
      input
    );
    if (serialized === void 0) {
      throw new Error("Failed to marshallValue");
    }
    return serialized;
  }

  private unmarshall(input: AttributeValue): T | null {
    if ("NULL" in input) {
      return null;
    }
    const deserialized: { foo: T } = marshaller.unmarshallItem(
      { foo: this._schema.serializeItem() },
      { foo: input }
    );
    return deserialized.foo;
  }

  public serializeItem(): marshaller.SchemaType {
    return {
      type: "Custom",
      marshall: this.marshall.bind(this),
      unmarshall: this.unmarshall.bind(this),
    };
  }
}

/**
 * Nullable Schema
 */
export function nullable<T>(item: Schema<T>): Schema<T | null> {
  return new NullableSchema(item);
}

/** Type for `{ ...t, ...v }`
 */
export type Merged<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends Record<any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  V extends Required<Record<any, any>>
> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { [K in keyof T]: K extends keyof V ? any : T[K] } & V;

/**
 * Object Schema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ObjectSchema<T extends Record<string, any>> extends Schema<T> {
  /** Returns shape of the Schema.
   */
  public readonly shape!: Record<keyof T, Schema<T[keyof T]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(schema: Record<keyof T, Schema<any>>) {
    super();
    this.shape = schema;
  }
  /** Empty `ObjectSchema`.
   *
   * Used for the entry point to build a complex object.
   */
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static empty: () => ObjectSchema<{}> = () => new ObjectSchema({});

  /** Asign required field.
   *
   * Note that `Schema` cannot handle objects with any optional fields.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public field<V extends Required<Record<string, any>>>(
    name: string,
    schema: Schema<V[keyof V]>
  ): ObjectSchema<Merged<T, V>> {
    return new ObjectSchema<Merged<T, V>>({
      ...this.shape,
      [name]: schema,
    } as Merged<T, V>);
  }
  public serializeValue(): marshaller.Schema {
    return Object.fromEntries(
      Object.entries(this.shape).map(([key, schema]) => [
        key,
        schema.serializeItem(),
      ])
    );
  }
  public serializeItem(): marshaller.SchemaType {
    return {
      type: "Document",
      members: this.serializeValue(),
    };
  }
  public marshallItem(input: T): AttributeMap {
    return marshaller.marshallItem(this.serializeValue(), input);
  }
  public unmarshallItem(input: AttributeMap): T {
    const schema = this.serializeValue();
    const ret: T = marshaller.unmarshallItem<T>(schema, input);
    // It seems that marshaller.unmarshallItem has a bug...
    Object.keys(this.shape).forEach((key) => {
      if (ret[key] === void 0) {
        throw new Error(
          `Value for property ${key} is unexpected.\nExpected: ${JSON.stringify(schema[key])}\nActual: ${JSON.stringify(input[key])}`
        );
      }
    });
    return ret;
  }
}
