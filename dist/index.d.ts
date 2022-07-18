/**
 * Type safe schema for DynamoDB.
 * @module
 */
import type { AttributeMap } from "aws-sdk/clients/dynamodb";
import * as marshaller from "@aws/dynamodb-data-marshaller";
/**
 * Schema
 */
export declare abstract class Schema<T> {
    /** DO NOT ACCESS THIS!
     */
    readonly _I_AM_FOOL_ENOUGH_TO_ACCESS_THIS: T;
    abstract serializeItem(): marshaller.SchemaType;
}
/**
 * Infer type of Schema.
 */
export declare type infer<S extends Schema<any>> = S["_I_AM_FOOL_ENOUGH_TO_ACCESS_THIS"];
/**
 * Binary Schema
 */
export declare const buffer: () => Schema<ArrayBufferView | ArrayBuffer>;
/**
 * Boolean Schema
 */
export declare const boolean: () => Schema<boolean>;
/**
 * Date Schema
 */
export declare const date: () => Schema<Date>;
/**
 * Number Schema.
 */
export declare const number: () => Schema<number>;
/**
 * String Schema.
 */
export declare const string: () => Schema<string>;
/**
 * Array Schema
 */
export declare function array<T>(item: Schema<T>): Schema<T[]>;
/**
 * Map Schema
 */
export declare function map<T>(item: Schema<T>): Schema<Map<string, T>>;
/**
 * Set Schema
 */
export declare function set<T extends ArrayBuffer | ArrayBufferView | number | string>(item: Schema<T>): Schema<Set<T>>;
/**
 * Nullable Schema
 */
export declare function nullable<T>(item: Schema<T>): Schema<T | null>;
/** Type for `{ ...t, ...v }`
 */
export declare type Merged<T extends Record<any, any>, V extends Required<Record<any, any>>> = {
    [K in keyof T]: K extends keyof V ? any : T[K];
} & V;
/**
 * Object Schema
 */
export declare class ObjectSchema<T extends Record<string, any>> extends Schema<T> {
    /** Returns shape of the Schema.
     */
    readonly shape: Record<keyof T, Schema<T[keyof T]>>;
    private constructor();
    /** Empty `ObjectSchema`.
     *
     * Used for the entry point to build a complex object.
     */
    static empty: () => ObjectSchema<{}>;
    /** Asign required field.
     *
     * Note that `Schema` cannot handle objects with any optional fields.
     */
    field<V extends Required<Record<string, any>>>(name: string, schema: Schema<V[keyof V]>): ObjectSchema<Merged<T, V>>;
    serializeValue(): marshaller.Schema;
    serializeItem(): marshaller.SchemaType;
    marshallItem(input: T): AttributeMap;
    unmarshallItem(input: AttributeMap): T;
}
