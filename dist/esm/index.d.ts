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
    readonly _target: T;
    abstract serializeItem(): marshaller.SchemaType;
}
/**
 * Infer type of Schema.
 */
export declare type infer<S extends Schema<any>> = S["_target"];
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
/**
 * Object Schema
 */
export declare class ObjectSchema<T extends {
    [key: string]: any;
}> extends Schema<T> {
    readonly _schema: Array<[keyof T, Schema<T[keyof T]>]>;
    private constructor();
    static entry: ObjectSchema<{}>;
    /** Asign required field.
     *
     * Note that `Schema` cannot handle objects with any optional fields.
     */
    field<V extends {
        [key: string]: any;
    }>(name: string, schema: Schema<V[keyof V]>): ObjectSchema<T & {
        [key in keyof V]-?: V[key];
    }>;
    serializeValue(): marshaller.Schema;
    serializeItem(): marshaller.SchemaType;
    marshallItem(input: T): AttributeMap;
    unmarshallItem(input: AttributeMap): T;
}
//# sourceMappingURL=index.d.ts.map