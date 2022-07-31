/**
 * Type safe schema for DynamoDB.
 * @module
 */

import type { AttributeValue } from "aws-sdk/clients/dynamodb";
import type * as clients from "aws-sdk/clients/dynamodb";
import * as marshaller from "@aws/dynamodb-data-marshaller";
// import {unmarshallItem, marshallValue} from "@aws/dynamodb-data-marshaller";

/**
 * Schema
 * @group Core
 */
export abstract class Schema<T> {
  /** @hidden */
  readonly _I_AM_FOOL_ENOUGH_TO_ACCESS_THIS!: T;
  abstract serializeItem(): marshaller.SchemaType;
}

/**
 * Infer type of Schema.
 * @group Core
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
 * @group Primitive Schema
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
 * @group Primitive Schema
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
 * @group Primitive Schema
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
 * @group Primitive Schema
 */
export const number: () => Schema<number> = () => new NumberSchema();

class BigIntSchema extends Schema<BigInt> {
  constructor() {
    super();
  }
  public serializeItem(): marshaller.SchemaType {
    return {
      type: "Custom",
      marshall(input: BigInt) {
        return { "N": input.toString() };
      },
      unmarshall(input: AttributeValue) {
        if ("N" in input && input.N !== void 0) {
          return BigInt(input.N);
        }
        throw new Error("Not a Number");
      },
    };
  }
}

/**
 * BigInt Schema.
 * @group Primitive Schema
 */
export const bigInt: () => Schema<BigInt> = () => new BigIntSchema();

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
 * @group Primitive Schema
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
 * @group Combinator
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
 * @group Combinator
 */
export function map<T>(item: Schema<T>): Schema<Map<string, T>> {
  return new MapSchema(item);
}

class SetSchema<
  T extends ArrayBuffer | ArrayBufferView | number | BigInt | string
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
    if (this._schema instanceof BigIntSchema) {
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
 * @group Combinator
 */
export function set<T extends ArrayBuffer | ArrayBufferView | number | BigInt | string>(
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
 * @group Combinator
 */
export function nullable<T>(item: Schema<T>): Schema<T | null> {
  return new NullableSchema(item);
}

/** @group Helper
 */
export type AttributeMap = clients.AttributeMap;

/** Type for `{ ...t, ...v }`
 * @group Helper
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
 * @group Core
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ObjectSchema<T extends Record<string, any>> extends Schema<T> {
  /** Returns shape of the Schema.
   */
  public readonly shape!: { [K in keyof T]: Schema<T[K]> };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(schema: { [K in keyof T]: Schema<T[K]> }) {
    super();
    this.shape = schema;
  }

  public static fromRecord<T>(schema: {
    [K in keyof T]: Schema<T[K]>;
  }): ObjectSchema<{ [K in keyof T]: T[K] }> {
    return new ObjectSchema(schema);
  }

  /** Asign required field.
   *
   * Note that `Schema` cannot handle objects with any optional fields.
   *
   * @example
   * ```ts
   * ObjectSchema.object()
   *   .extendField<{ foo: string }>("foo", string())
   *   .extendField<{ readonly bar: number }>("bar", number())
   * // => Returns Schema for `{ foo: string; readonly bar: number }`
   * ```
   */
  public extendField<K extends string, V>(
    name: K,
    schema: Schema<V>
  ): ObjectSchema<Merged<T, { [key in K]: V }>> {
    return new ObjectSchema<Merged<T, { [key in K]: V }>>({
      ...this.shape,
      [name]: schema,
    });
  }
  /** Omit required fields.
   *
   * @example
   * ```ts
   * object({
   *  "foo": string(),
   *  "bar": number(),
   * })
   *   .omitField("foo")
   * // => Returns Schema for `{ bar: number }`
   * ```
   */
  public omitField<K extends keyof T>(key: K): ObjectSchema<Omit<T, K>> {
    const { [key]: value, ...omitted } = this.shape;
    return new ObjectSchema<Omit<T, K>>(omitted);
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
          `Value for property ${key} is unexpected.\nExpected: ${JSON.stringify(
            schema[key]
          )}\nActual: ${JSON.stringify(input[key])}`
        );
      }
    });
    return ret;
  }
}

/**
 * Object Schema
 * @group Combinator
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function object<T extends Record<string, any>>(item: {
  [K in keyof T]: Schema<T[K]>;
}): ObjectSchema<T> {
  return ObjectSchema.fromRecord<T>(item);
}
