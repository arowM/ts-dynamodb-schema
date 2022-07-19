/**
 * Type safe schema for DynamoDB.
 * @module
 */
import type { AttributeMap } from "aws-sdk/clients/dynamodb";
import * as marshaller from "@aws/dynamodb-data-marshaller";
/**
 * Schema
 * @group Core
 */
export declare abstract class Schema<T> {
    /** @hidden */
    readonly _I_AM_FOOL_ENOUGH_TO_ACCESS_THIS: T;
    abstract serializeItem(): marshaller.SchemaType;
}
/**
 * Infer type of Schema.
 * @group Core
 */
export declare type infer<S extends Schema<any>> = S["_I_AM_FOOL_ENOUGH_TO_ACCESS_THIS"];
/**
 * Binary Schema
 * @group Primitive Schema
 */
export declare const buffer: () => Schema<ArrayBufferView | ArrayBuffer>;
/**
 * Boolean Schema
 * @group Primitive Schema
 */
export declare const boolean: () => Schema<boolean>;
/**
 * Date Schema
 * @group Primitive Schema
 */
export declare const date: () => Schema<Date>;
/**
 * Number Schema.
 * @group Primitive Schema
 */
export declare const number: () => Schema<number>;
/**
 * String Schema.
 * @group Primitive Schema
 */
export declare const string: () => Schema<string>;
/**
 * Array Schema
 * @group Combinator
 */
export declare function array<T>(item: Schema<T>): Schema<T[]>;
/**
 * Map Schema
 * @group Combinator
 */
export declare function map<T>(item: Schema<T>): Schema<Map<string, T>>;
/**
 * Set Schema
 * @group Combinator
 */
export declare function set<T extends ArrayBuffer | ArrayBufferView | number | string>(item: Schema<T>): Schema<Set<T>>;
/**
 * Nullable Schema
 * @group Combinator
 */
export declare function nullable<T>(item: Schema<T>): Schema<T | null>;
/** Type for `{ ...t, ...v }`
 * @group Helper
 */
export declare type Merged<T extends Record<any, any>, V extends Required<Record<any, any>>> = {
    [K in keyof T]: K extends keyof V ? any : T[K];
} & V;
/**
 * Object Schema
 * @group Core
 */
export declare class ObjectSchema<T extends Record<string, any>> extends Schema<T> {
    /** Returns shape of the Schema.
     */
    readonly shape: {
        [K in keyof T]: Schema<T[K]>;
    };
    private constructor();
    static fromRecord<T>(schema: {
        [K in keyof T]: Schema<T[K]>;
    }): ObjectSchema<{
        [K in keyof T]: T[K];
    }>;
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
    extendField<K extends string, V>(name: K, schema: Schema<V>): ObjectSchema<Merged<T, {
        [key in K]: V;
    }>>;
    serializeValue(): marshaller.Schema;
    serializeItem(): marshaller.SchemaType;
    marshallItem(input: T): AttributeMap;
    unmarshallItem(input: AttributeMap): T;
}
/**
 * Object Schema
 * @group Combinator
 */
export declare function object<T extends Record<string, any>>(item: {
    [K in keyof T]: Schema<T[K]>;
}): ObjectSchema<T>;
