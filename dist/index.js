"use strict";
/**
 * Type safe schema for DynamoDB.
 * @module
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectSchema = exports.nullable = exports.set = exports.map = exports.array = exports.string = exports.number = exports.date = exports.boolean = exports.buffer = exports.Schema = void 0;
const marshaller = __importStar(require("@aws/dynamodb-data-marshaller"));
// import {unmarshallItem, marshallValue} from "@aws/dynamodb-data-marshaller";
/**
 * Schema
 */
class Schema {
}
exports.Schema = Schema;
class BinarySchema extends Schema {
    constructor() {
        super();
    }
    serializeItem() {
        return { type: "Binary" };
    }
}
/**
 * Binary Schema
 */
const buffer = () => new BinarySchema();
exports.buffer = buffer;
class BooleanSchema extends Schema {
    constructor() {
        super();
    }
    serializeItem() {
        return { type: "Boolean" };
    }
}
/**
 * Boolean Schema
 */
const boolean = () => new BooleanSchema();
exports.boolean = boolean;
class DateSchema extends Schema {
    constructor() {
        super();
    }
    serializeItem() {
        return { type: "Date" };
    }
}
/**
 * Date Schema
 */
const date = () => new DateSchema();
exports.date = date;
class NumberSchema extends Schema {
    constructor() {
        super();
    }
    serializeItem() {
        return { type: "Number" };
    }
}
/**
 * Number Schema.
 */
const number = () => new NumberSchema();
exports.number = number;
class StringSchema extends Schema {
    constructor() {
        super();
    }
    serializeItem() {
        return { type: "String" };
    }
}
/**
 * String Schema.
 */
const string = () => new StringSchema();
exports.string = string;
class ArraySchema extends Schema {
    constructor(schema) {
        super();
        this._schema = schema;
    }
    serializeItem() {
        return {
            type: "List",
            memberType: this._schema.serializeItem(),
        };
    }
}
/**
 * Array Schema
 */
function array(item) {
    return new ArraySchema(item);
}
exports.array = array;
class MapSchema extends Schema {
    constructor(schema) {
        super();
        this._schema = schema;
    }
    serializeItem() {
        return {
            type: "Map",
            memberType: this._schema.serializeItem(),
        };
    }
}
/**
 * Map Schema
 */
function map(item) {
    return new MapSchema(item);
}
exports.map = map;
class SetSchema extends Schema {
    constructor(schema) {
        super();
        this._schema = schema;
    }
    memberType() {
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
    serializeItem() {
        return {
            type: "Set",
            memberType: this.memberType(),
        };
    }
}
/**
 * Set Schema
 */
function set(item) {
    return new SetSchema(item);
}
exports.set = set;
class NullableSchema extends Schema {
    constructor(schema) {
        super();
        this._schema = schema;
    }
    marshall(input) {
        if (input === null) {
            return {
                NULL: true,
            };
        }
        const serialized = marshaller.marshallValue(this._schema.serializeItem(), input);
        if (serialized === void 0) {
            throw new Error("Failed to marshallValue");
        }
        return serialized;
    }
    unmarshall(input) {
        if ("NULL" in input) {
            return null;
        }
        const deserialized = marshaller.unmarshallItem({ foo: this._schema.serializeItem() }, { foo: input });
        return deserialized.foo;
    }
    serializeItem() {
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
function nullable(item) {
    return new NullableSchema(item);
}
exports.nullable = nullable;
/**
 * Object Schema
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ObjectSchema extends Schema {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(schema) {
        super();
        this._schema = schema;
    }
    /** Asign required field.
     *
     * Note that `Schema` cannot handle objects with any optional fields.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field(name, schema) {
        return new ObjectSchema([
            ...this._schema,
            [name, schema],
        ]);
    }
    serializeValue() {
        return Object.fromEntries(this._schema.map(([key, schema]) => [key, schema.serializeItem()]));
    }
    serializeItem() {
        return {
            type: "Document",
            members: this.serializeValue(),
        };
    }
    marshallItem(input) {
        return marshaller.marshallItem(this.serializeValue(), input);
    }
    unmarshallItem(input) {
        const ret = marshaller.unmarshallItem(this.serializeValue(), input);
        // It seems that marshaller.unmarshallItem has a bug...
        this._schema.forEach(([key]) => {
            if (!(key in ret)) {
                throw new Error('Required Attribute "' + key.toString() + '" is not found.');
            }
        });
        return ret;
    }
}
exports.ObjectSchema = ObjectSchema;
// eslint-disable-next-line @typescript-eslint/ban-types
ObjectSchema.entry = new ObjectSchema([]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCwwRUFBNEQ7QUFDNUQsK0VBQStFO0FBRS9FOztHQUVHO0FBQ0gsTUFBc0IsTUFBTTtDQUczQjtBQUhELHdCQUdDO0FBUUQsTUFBTSxZQUFhLFNBQVEsTUFBcUM7SUFDOUQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSSxNQUFNLE1BQU0sR0FBZ0QsR0FBRyxFQUFFLENBQ3RFLElBQUksWUFBWSxFQUFFLENBQUM7QUFEUixRQUFBLE1BQU0sVUFDRTtBQUVyQixNQUFNLGFBQWMsU0FBUSxNQUFlO0lBQ3pDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0ksTUFBTSxPQUFPLEdBQTBCLEdBQUcsRUFBRSxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7QUFBM0QsUUFBQSxPQUFPLFdBQW9EO0FBRXhFLE1BQU0sVUFBVyxTQUFRLE1BQVk7SUFDbkM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDMUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSSxNQUFNLElBQUksR0FBdUIsR0FBRyxFQUFFLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUFsRCxRQUFBLElBQUksUUFBOEM7QUFFL0QsTUFBTSxZQUFhLFNBQVEsTUFBYztJQUN2QztRQUNFLEtB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R0FBRyxDQUFDO0lBQ2IsQ0FBQzs7QUFqREgsb0NBa0RDO0FBM0NDLHdEQUF3RDtBQUMxQyxrQkFBSyxHQUFxQixJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVHlwZSBzYWZlIHNjaGVtYSBmb3IgRHluYW1vREIuXG4gKiBAbW9kdWxlXG4gKi9cblxuaW1wb3J0IHR5cGUgeyBBdHRyaWJ1dGVWYWx1ZSwgQXR0cmlidXRlTWFwIH0gZnJvbSBcImF3cy1zZGsvY2xpZW50cy9keW5hbW9kYlwiO1xuaW1wb3J0ICogYXMgbWFyc2hhbGxlciBmcm9tIFwiQGF3cy9keW5hbW9kYi1kYXRhLW1hcnNoYWxsZXJcIjtcbi8vIGltcG9ydCB7dW5tYXJzaGFsbEl0ZW0sIG1hcnNoYWxsVmFsdWV9IGZyb20gXCJAYXdzL2R5bmFtb2RiLWRhdGEtbWFyc2hhbGxlclwiO1xuXG4vKipcbiAqIFNjaGVtYVxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgU2NoZW1hPFQ+IHtcbiAgcmVhZG9ubHkgX3RhcmdldCE6IFQ7XG4gIGFic3RyYWN0IHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlO1xufVxuXG4vKipcbiAqIEluZmVyIHR5cGUgb2YgU2NoZW1hLlxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IHR5cGUgaW5mZXI8UyBleHRlbmRzIFNjaGVtYTxhbnk+PiA9IFNbXCJfdGFyZ2V0XCJdO1xuXG5jbGFzcyBCaW5hcnlTY2hlbWEgZXh0ZW5kcyBTY2hlbWE8QXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXc+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiQmluYXJ5XCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIEJpbmFyeSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJ1ZmZlcjogKCkgPT4gU2NoZW1hPEFycmF5QnVmZmVyVmlldyB8IEFycmF5QnVmZmVyPiA9ICgpID0+XG4gIG5ldyBCaW5hcnlTY2hlbWEoKTtcblxuY2xhc3MgQm9vbGVhblNjaGVtYSBleHRlbmRzIFNjaGVtYTxib29sZWFuPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIkJvb2xlYW5cIiB9O1xuICB9XG59XG5cbi8qKlxuICogQm9vbGVhbiBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJvb2xlYW46ICgpID0+IFNjaGVtYTxib29sZWFuPiA9ICgpID0+IG5ldyBCb29sZWFuU2NoZW1hKCk7XG5cbmNsYXNzIERhdGVTY2hlbWEgZXh0ZW5kcyBTY2hlbWE8RGF0ZT4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJEYXRlXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIERhdGUgU2NoZW1hXG4gKi9cbmV4cG9ydCBjb25zdCBkYXRlOiAoKSA9PiBTY2hlbWE8RGF0ZT4gPSAoKSA9PiBuZXcgRGF0ZVNjaGVtYSgpO1xuXG5jbGFzcyBOdW1iZXJTY2hlbWEgZXh0ZW5kcyBTY2hlbWE8bnVtYmVyPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIk51bWJlclwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBOdW1iZXIgU2NoZW1hLlxuICovXG5leHBvcnQgY29uc3QgbnVtYmVyOiAoKSA9PiBTY2hlbWE8bnVtYmVyPiA9ICgpID0+IG5ldyBOdW1iZXJTY2hlbWEoKTtcblxuY2xhc3MgU3RyaW5nU2NoZW1hIGV4dGVuZHMgU2NoZW1hPHN0cmluZz4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJTdHJpbmdcIiB9O1xuICB9XG59XG5cbi8qKlxuICogU3RyaW5nIFNjaGVtYS5cbiAqL1xuZXhwb3J0IGNvbnN0IHN0cmluZzogKCkgPT4gU2NoZW1hPHN0cmluZz4gPSAoKSA9PiBuZXcgU3RyaW5nU2NoZW1hKCk7XG5cbmNsYXNzIEFycmF5U2NoZW1hPFQ+IGV4dGVuZHMgU2NoZW1hPFRbXT4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiTGlzdFwiLFxuICAgICAgbWVtYmVyVHlwZTogdGhpcy5fc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogQXJyYXkgU2NoZW1hXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiB7XG4gIHJldHVybiBuZXcgQXJyYXlTY2hlbWEoaXRlbSk7XG59XG5cbmNsYXNzIE1hcFNjaGVtYTxUPiBleHRlbmRzIFNjaGVtYTxNYXA8c3RyaW5nLCBUPj4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiTWFwXCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgU2NoZW1hXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXA8VD4oaXRlbTogU2NoZW1hPFQ+KTogU2NoZW1hPE1hcDxzdHJpbmcsIFQ+PiB7XG4gIHJldHVybiBuZXcgTWFwU2NoZW1hKGl0ZW0pO1xufVxuXG5jbGFzcyBTZXRTY2hlbWE8XG4gIFQgZXh0ZW5kcyBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyB8IG51bWJlciB8IHN0cmluZ1xuPiBleHRlbmRzIFNjaGVtYTxTZXQ8VD4+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuXG4gIHByaXZhdGUgbWVtYmVyVHlwZSgpOiBcIlN0cmluZ1wiIHwgXCJOdW1iZXJcIiB8IFwiQmluYXJ5XCIge1xuICAgIGlmICh0aGlzLl9zY2hlbWEgaW5zdGFuY2VvZiBCaW5hcnlTY2hlbWEpIHtcbiAgICAgIHJldHVybiBcIkJpbmFyeVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgTnVtYmVyU2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJOdW1iZXJcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NjaGVtYSBpbnN0YW5jZW9mIFN0cmluZ1NjaGVtYSkge1xuICAgICAgcmV0dXJuIFwiU3RyaW5nXCI7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgU2V0XCIpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiU2V0XCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLm1lbWJlclR5cGUoKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogU2V0IFNjaGVtYVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0PFQgZXh0ZW5kcyBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyB8IG51bWJlciB8IHN0cmluZz4oXG4gIGl0ZW06IFNjaGVtYTxUPlxuKTogU2NoZW1hPFNldDxUPj4ge1xuICByZXR1cm4gbmV3IFNldFNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgTnVsbGFibGVTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuXG4gIHByaXZhdGUgbWFyc2hhbGwoaW5wdXQ6IFQgfCBudWxsKTogQXR0cmlidXRlVmFsdWUge1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgTlVMTDogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc2VyaWFsaXplZDogQXR0cmlidXRlVmFsdWUgfCB1bmRlZmluZWQgPSBtYXJzaGFsbGVyLm1hcnNoYWxsVmFsdWUoXG4gICAgICB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgICAgaW5wdXRcbiAgICApO1xuICAgIGlmIChzZXJpYWxpemVkID09PSB2b2lkIDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBtYXJzaGFsbFZhbHVlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgfVxuXG4gIHByaXZhdGUgdW5tYXJzaGFsbChpbnB1dDogQXR0cmlidXRlVmFsdWUpOiBUIHwgbnVsbCB7XG4gICAgaWYgKFwiTlVMTFwiIGluIGlucHV0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZGVzZXJpYWxpemVkOiB7IGZvbzogVCB9ID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbShcbiAgICAgIHsgZm9vOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpIH0sXG4gICAgICB7IGZvbzogaW5wdXQgfVxuICAgICk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZC5mb287XG4gIH1cblxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkN1c3RvbVwiLFxuICAgICAgbWFyc2hhbGw6IHRoaXMubWFyc2hhbGwuYmluZCh0aGlzKSxcbiAgICAgIHVubWFyc2hhbGw6IHRoaXMudW5tYXJzaGFsbC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBOdWxsYWJsZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG51bGxhYmxlPFQ+KGl0ZW06IFNjaGVtYTxUPik6IFNjaGVtYTxUIHwgbnVsbD4ge1xuICByZXR1cm4gbmV3IE51bGxhYmxlU2NoZW1hKGl0ZW0pO1xufVxuXG4vKipcbiAqIE9iamVjdCBTY2hlbWFcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBjbGFzcyBPYmplY3RTY2hlbWE8VCBleHRlbmRzIHsgW2tleTogc3RyaW5nXTogYW55IH0+IGV4dGVuZHMgU2NoZW1hPFQ+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IEFycmF5PFtrZXlvZiBULCBTY2hlbWE8VFtrZXlvZiBUXT5dPjtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihzY2hlbWE6IEFycmF5PFtrZXlvZiBULCBTY2hlbWE8YW55Pl0+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHlwZXNcbiAgcHVibGljIHN0YXRpYyBlbnRyeTogT2JqZWN0U2NoZW1hPHt9PiA9IG5ldyBPYmplY3RTY2hlbWEoW10pO1xuXG4gIC8qKiBBc2lnbiByZXF1aXJlZCBmaWVsZC5cbiAgICpcbiAgICogTm90ZSB0aGF0IGBTY2hlbWFgIGNhbm5vdCBoYW5kbGUgb2JqZWN0cyB3aXRoIGFueSBvcHRpb25hbCBmaWVsZHMuXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBwdWJsaWMgZmllbGQ8ViBleHRlbmRzIHsgW2tleTogc3RyaW5nXTogYW55IH0+KFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBzY2hlbWE6IFNjaGVtYTxWW2tleW9mIFZdPlxuICApOiBPYmplY3RTY2hlbWE8VCAmIHsgW2tleSBpbiBrZXlvZiBWXS0/OiBWW2tleV0gfT4ge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U2NoZW1hPFQgJiB7IFtrZXkgaW4ga2V5b2YgVl0tPzogVltrZXldIH0+KFtcbiAgICAgIC4uLnRoaXMuX3NjaGVtYSxcbiAgICAgIFtuYW1lLCBzY2hlbWFdLFxuICAgIF0pO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVWYWx1ZSgpOiBtYXJzaGFsbGVyLlNjaGVtYSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgIHRoaXMuX3NjaGVtYS5tYXAoKFtrZXksIHNjaGVtYV0pID0+IFtrZXksIHNjaGVtYS5zZXJpYWxpemVJdGVtKCldKVxuICAgICk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJEb2N1bWVudFwiLFxuICAgICAgbWVtYmVyczogdGhpcy5zZXJpYWxpemVWYWx1ZSgpLFxuICAgIH07XG4gIH1cbiAgcHVibGljIG1hcnNoYWxsSXRlbShpbnB1dDogVCk6IEF0dHJpYnV0ZU1hcCB7XG4gICAgcmV0dXJuIG1hcnNoYWxsZXIubWFyc2hhbGxJdGVtKHRoaXMuc2VyaWFsaXplVmFsdWUoKSwgaW5wdXQpO1xuICB9XG4gIHB1YmxpYyB1bm1hcnNoYWxsSXRlbShpbnB1dDogQXR0cmlidXRlTWFwKTogVCB7XG4gICAgY29uc3QgcmV0OiBUID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbTxUPih0aGlzLnNlcmlhbGl6ZVZhbHVlKCksIGlucHV0KTtcbiAgICAvLyBJdCBzZWVtcyB0aGF0IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW0gaGFzIGEgYnVnLi4uXG4gICAgdGhpcy5fc2NoZW1hLmZvckVhY2goKFtrZXldKSA9PiB7XG4gICAgICBpZiAoIShrZXkgaW4gcmV0KSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ1JlcXVpcmVkIEF0dHJpYnV0ZSBcIicgKyBrZXkudG9TdHJpbmcoKSArICdcIiBpcyBub3QgZm91bmQuJ1xuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbn1cbiJdfQ==