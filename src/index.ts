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
  readonly _target!: T;
  abstract serializeItem(): marshaller.SchemaType;
}

/**
 * Infer type of Schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type infer<S extends Schema<any>> = S["_target"];

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

/**
 * Object Schema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ObjectSchema<T extends { [key: string]: any }> extends Schema<T> {
  readonly _schema!: Array<[keyof T, Schema<T[keyof T]>]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private constructor(schema: Array<[keyof T, Schema<any>]>) {
    super();
    this._schema = schema;
  }
  // eslint-disable-next-line @typescript-eslint/ban-types
  public static entry: ObjectSchema<{}> = new ObjectSchema([]);

  /** Asign required field.
   *
   * Note that `Schema` cannot handle objects with any optional fields.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public field<V extends { [key: string]: any }>(
    name: string,
    schema: Schema<V[keyof V]>
  ): ObjectSchema<T & { [key in keyof V]-?: V[key] }> {
    return new ObjectSchema<T & { [key in keyof V]-?: V[key] }>([
      ...this._schema,
      [name, schema],
    ]);
  }
  public serializeValue(): marshaller.Schema {
    return Object.fromEntries(
      this._schema.map(([key, schema]) => [key, schema.serializeItem()])
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
    const ret: T = marshaller.unmarshallItem<T>(this.serializeValue(), input);
    // It seems that marshaller.unmarshallItem has a bug...
    this._schema.forEach(([key]) => {
      if (!(key in ret)) {
        throw new Error(
          'Required Attribute "' + key.toString() + '" is not found.'
        );
      }
    });
    return ret;
  }
}
