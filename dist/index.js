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
        this.shape = schema;
    }
    /** Asign required field.
     *
     * Note that `Schema` cannot handle objects with any optional fields.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field(name, schema) {
        return new ObjectSchema({
            ...this.shape,
            [name]: schema,
        });
    }
    serializeValue() {
        return Object.fromEntries(Object.entries(this.shape).map(([key, schema]) => [
            key,
            schema.serializeItem(),
        ]));
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
        const schema = this.serializeValue();
        const ret = marshaller.unmarshallItem(schema, input);
        // It seems that marshaller.unmarshallItem has a bug...
        Object.keys(this.shape).forEach((key) => {
            if (ret[key] === void 0) {
                throw new Error(`Value for property ${key} is unexpected.\nExpected: ${JSON.stringify(schema[key])}\nActual: ${JSON.stringify(input[key])}`);
            }
        });
        return ret;
    }
}
exports.ObjectSchema = ObjectSchema;
/** Empty `ObjectSchema`.
 *
 * Used for the entry point to build a complex object.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
ObjectSchema.empty = () => new ObjectSchema({});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCwwRUFBNEQ7QUFDNUQsK0VBQStFO0FBRS9FOztHQUVHO0FBQ0gsTUFBc0IsTUFBTTtDQUszQjtBQUxELHdCQUtDO0FBU0QsTUFBTSxZQUFhLFNBQVEsTUFBcUM7SUFDOUQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSSxNQUFNLE1BQU0sR0FBZ0QsR0FBRyxFQUFFLENBQ3RFLElBQUksWUFBWSxFQUFFLENBQUM7QUFEUixRQUFBLE1BQU0sVUFDRTtBQUVyQixNQUFNLGFBQWMsU0FBUSxNQUFlO0lBQ3pDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0ksTUFBTSxPQUFPLEdBQTBCLEdBQUcsRUFBRSxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7QUFBM0QsUUFBQSxPQUFPLFdBQW9EO0FBRXhFLE1BQU0sVUFBVyxTQUFRLE1BQVk7SUFDbkM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDMUIsQ0FBQztDQUNGO0FBRUQ7O0dBRUc7QUFDSSxNQUFNLElBQUksR0FBdUIsR0FBRyxFQUFFLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUFsRCxRQUFBLElBQUksUUFBOEM7QUFFL0QsTUFBTSxZQUFhLFNBQVEsTUFBYztJQUN2QztRQUNFLEtB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QkFBOEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQzVILENBQUM7YUFDSDtRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDOztBQTNESCxvQ0E0REM7QUFuREM7OztHQUdHO0FBQ0gsd0RBQXdEO0FBQzFDLGtCQUFLLEdBQTJCLEdBQUcsRUFBRSxDQUFDLElBQUksWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUeXBlIHNhZmUgc2NoZW1hIGZvciBEeW5hbW9EQi5cbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZVZhbHVlLCBBdHRyaWJ1dGVNYXAgfSBmcm9tIFwiYXdzLXNkay9jbGllbnRzL2R5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBtYXJzaGFsbGVyIGZyb20gXCJAYXdzL2R5bmFtb2RiLWRhdGEtbWFyc2hhbGxlclwiO1xuLy8gaW1wb3J0IHt1bm1hcnNoYWxsSXRlbSwgbWFyc2hhbGxWYWx1ZX0gZnJvbSBcIkBhd3MvZHluYW1vZGItZGF0YS1tYXJzaGFsbGVyXCI7XG5cbi8qKlxuICogU2NoZW1hXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTY2hlbWE8VD4ge1xuICAvKiogRE8gTk9UIEFDQ0VTUyBUSElTIVxuICAgKi9cbiAgcmVhZG9ubHkgX0lfQU1fRk9PTF9FTk9VR0hfVE9fQUNDRVNTX1RISVMhOiBUO1xuICBhYnN0cmFjdCBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZTtcbn1cblxuLyoqXG4gKiBJbmZlciB0eXBlIG9mIFNjaGVtYS5cbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIGluZmVyPFMgZXh0ZW5kcyBTY2hlbWE8YW55Pj4gPVxuICBTW1wiX0lfQU1fRk9PTF9FTk9VR0hfVE9fQUNDRVNTX1RISVNcIl07XG5cbmNsYXNzIEJpbmFyeVNjaGVtYSBleHRlbmRzIFNjaGVtYTxBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldz4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJCaW5hcnlcIiB9O1xuICB9XG59XG5cbi8qKlxuICogQmluYXJ5IFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgYnVmZmVyOiAoKSA9PiBTY2hlbWE8QXJyYXlCdWZmZXJWaWV3IHwgQXJyYXlCdWZmZXI+ID0gKCkgPT5cbiAgbmV3IEJpbmFyeVNjaGVtYSgpO1xuXG5jbGFzcyBCb29sZWFuU2NoZW1hIGV4dGVuZHMgU2NoZW1hPGJvb2xlYW4+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiQm9vbGVhblwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBCb29sZWFuIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgYm9vbGVhbjogKCkgPT4gU2NoZW1hPGJvb2xlYW4+ID0gKCkgPT4gbmV3IEJvb2xlYW5TY2hlbWEoKTtcblxuY2xhc3MgRGF0ZVNjaGVtYSBleHRlbmRzIFNjaGVtYTxEYXRlPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIkRhdGVcIiB9O1xuICB9XG59XG5cbi8qKlxuICogRGF0ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGRhdGU6ICgpID0+IFNjaGVtYTxEYXRlPiA9ICgpID0+IG5ldyBEYXRlU2NoZW1hKCk7XG5cbmNsYXNzIE51bWJlclNjaGVtYSBleHRlbmRzIFNjaGVtYTxudW1iZXI+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiTnVtYmVyXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIE51bWJlciBTY2hlbWEuXG4gKi9cbmV4cG9ydCBjb25zdCBudW1iZXI6ICgpID0+IFNjaGVtYTxudW1iZXI+ID0gKCkgPT4gbmV3IE51bWJlclNjaGVtYSgpO1xuXG5jbGFzcyBTdHJpbmdTY2hlbWEgZXh0ZW5kcyBTY2hlbWE8c3RyaW5nPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIlN0cmluZ1wiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBTdHJpbmcgU2NoZW1hLlxuICovXG5leHBvcnQgY29uc3Qgc3RyaW5nOiAoKSA9PiBTY2hlbWE8c3RyaW5nPiA9ICgpID0+IG5ldyBTdHJpbmdTY2hlbWEoKTtcblxuY2xhc3MgQXJyYXlTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VFtdPiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJMaXN0XCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBBcnJheSBTY2hlbWFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5PFQ+KGl0ZW06IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+IHtcbiAgcmV0dXJuIG5ldyBBcnJheVNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgTWFwU2NoZW1hPFQ+IGV4dGVuZHMgU2NoZW1hPE1hcDxzdHJpbmcsIFQ+PiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJNYXBcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMuX3NjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcCBTY2hlbWFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcDxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8TWFwPHN0cmluZywgVD4+IHtcbiAgcmV0dXJuIG5ldyBNYXBTY2hlbWEoaXRlbSk7XG59XG5cbmNsYXNzIFNldFNjaGVtYTxcbiAgVCBleHRlbmRzIEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3IHwgbnVtYmVyIHwgc3RyaW5nXG4+IGV4dGVuZHMgU2NoZW1hPFNldDxUPj4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG5cbiAgcHJpdmF0ZSBtZW1iZXJUeXBlKCk6IFwiU3RyaW5nXCIgfCBcIk51bWJlclwiIHwgXCJCaW5hcnlcIiB7XG4gICAgaWYgKHRoaXMuX3NjaGVtYSBpbnN0YW5jZW9mIEJpbmFyeVNjaGVtYSkge1xuICAgICAgcmV0dXJuIFwiQmluYXJ5XCI7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY2hlbWEgaW5zdGFuY2VvZiBOdW1iZXJTY2hlbWEpIHtcbiAgICAgIHJldHVybiBcIk51bWJlclwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgU3RyaW5nU2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJTdHJpbmdcIjtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBTZXRcIik7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJTZXRcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMubWVtYmVyVHlwZSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgU2NoZW1hXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXQ8VCBleHRlbmRzIEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3IHwgbnVtYmVyIHwgc3RyaW5nPihcbiAgaXRlbTogU2NoZW1hPFQ+XG4pOiBTY2hlbWE8U2V0PFQ+PiB7XG4gIHJldHVybiBuZXcgU2V0U2NoZW1hKGl0ZW0pO1xufVxuXG5jbGFzcyBOdWxsYWJsZVNjaGVtYTxUPiBleHRlbmRzIFNjaGVtYTxUIHwgbnVsbD4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG5cbiAgcHJpdmF0ZSBtYXJzaGFsbChpbnB1dDogVCB8IG51bGwpOiBBdHRyaWJ1dGVWYWx1ZSB7XG4gICAgaWYgKGlucHV0ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBOVUxMOiB0cnVlLFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25zdCBzZXJpYWxpemVkOiBBdHRyaWJ1dGVWYWx1ZSB8IHVuZGVmaW5lZCA9IG1hcnNoYWxsZXIubWFyc2hhbGxWYWx1ZShcbiAgICAgIHRoaXMuX3NjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgICBpbnB1dFxuICAgICk7XG4gICAgaWYgKHNlcmlhbGl6ZWQgPT09IHZvaWQgMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmFpbGVkIHRvIG1hcnNoYWxsVmFsdWVcIik7XG4gICAgfVxuICAgIHJldHVybiBzZXJpYWxpemVkO1xuICB9XG5cbiAgcHJpdmF0ZSB1bm1hcnNoYWxsKGlucHV0OiBBdHRyaWJ1dGVWYWx1ZSk6IFQgfCBudWxsIHtcbiAgICBpZiAoXCJOVUxMXCIgaW4gaW5wdXQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBkZXNlcmlhbGl6ZWQ6IHsgZm9vOiBUIH0gPSBtYXJzaGFsbGVyLnVubWFyc2hhbGxJdGVtKFxuICAgICAgeyBmb286IHRoaXMuX3NjaGVtYS5zZXJpYWxpemVJdGVtKCkgfSxcbiAgICAgIHsgZm9vOiBpbnB1dCB9XG4gICAgKTtcbiAgICByZXR1cm4gZGVzZXJpYWxpemVkLmZvbztcbiAgfVxuXG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiQ3VzdG9tXCIsXG4gICAgICBtYXJzaGFsbDogdGhpcy5tYXJzaGFsbC5iaW5kKHRoaXMpLFxuICAgICAgdW5tYXJzaGFsbDogdGhpcy51bm1hcnNoYWxsLmJpbmQodGhpcyksXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIE51bGxhYmxlIFNjaGVtYVxuICovXG5leHBvcnQgZnVuY3Rpb24gbnVsbGFibGU8VD4oaXRlbTogU2NoZW1hPFQ+KTogU2NoZW1hPFQgfCBudWxsPiB7XG4gIHJldHVybiBuZXcgTnVsbGFibGVTY2hlbWEoaXRlbSk7XG59XG5cbi8qKiBUeXBlIGZvciBgeyAuLi50LCAuLi52IH1gXG4gKi9cbmV4cG9ydCB0eXBlIE1lcmdlZDxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgVCBleHRlbmRzIFJlY29yZDxhbnksIGFueT4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIFYgZXh0ZW5kcyBSZXF1aXJlZDxSZWNvcmQ8YW55LCBhbnk+PlxuPiA9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHsgW0sgaW4ga2V5b2YgVF06IEsgZXh0ZW5kcyBrZXlvZiBWID8gYW55IDogVFtLXSB9ICYgVjtcblxuLyoqXG4gKiBPYmplY3QgU2NoZW1hXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgY2xhc3MgT2JqZWN0U2NoZW1hPFQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+PiBleHRlbmRzIFNjaGVtYTxUPiB7XG4gIC8qKiBSZXR1cm5zIHNoYXBlIG9mIHRoZSBTY2hlbWEuXG4gICAqL1xuICBwdWJsaWMgcmVhZG9ubHkgc2hhcGUhOiBSZWNvcmQ8a2V5b2YgVCwgU2NoZW1hPFRba2V5b2YgVF0+PjtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihzY2hlbWE6IFJlY29yZDxrZXlvZiBULCBTY2hlbWE8YW55Pj4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuc2hhcGUgPSBzY2hlbWE7XG4gIH1cbiAgLyoqIEVtcHR5IGBPYmplY3RTY2hlbWFgLlxuICAgKlxuICAgKiBVc2VkIGZvciB0aGUgZW50cnkgcG9pbnQgdG8gYnVpbGQgYSBjb21wbGV4IG9iamVjdC5cbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXR5cGVzXG4gIHB1YmxpYyBzdGF0aWMgZW1wdHk6ICgpID0+IE9iamVjdFNjaGVtYTx7fT4gPSAoKSA9PiBuZXcgT2JqZWN0U2NoZW1hKHt9KTtcblxuICAvKiogQXNpZ24gcmVxdWlyZWQgZmllbGQuXG4gICAqXG4gICAqIE5vdGUgdGhhdCBgU2NoZW1hYCBjYW5ub3QgaGFuZGxlIG9iamVjdHMgd2l0aCBhbnkgb3B0aW9uYWwgZmllbGRzLlxuICAgKi9cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgcHVibGljIGZpZWxkPFYgZXh0ZW5kcyBSZXF1aXJlZDxSZWNvcmQ8c3RyaW5nLCBhbnk+Pj4oXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHNjaGVtYTogU2NoZW1hPFZba2V5b2YgVl0+XG4gICk6IE9iamVjdFNjaGVtYTxNZXJnZWQ8VCwgVj4+IHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFNjaGVtYTxNZXJnZWQ8VCwgVj4+KHtcbiAgICAgIC4uLnRoaXMuc2hhcGUsXG4gICAgICBbbmFtZV06IHNjaGVtYSxcbiAgICB9IGFzIE1lcmdlZDxULCBWPik7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZVZhbHVlKCk6IG1hcnNoYWxsZXIuU2NoZW1hIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5zaGFwZSkubWFwKChba2V5LCBzY2hlbWFdKSA9PiBbXG4gICAgICAgIGtleSxcbiAgICAgICAgc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSxcbiAgICAgIF0pXG4gICAgKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkRvY3VtZW50XCIsXG4gICAgICBtZW1iZXJzOiB0aGlzLnNlcmlhbGl6ZVZhbHVlKCksXG4gICAgfTtcbiAgfVxuICBwdWJsaWMgbWFyc2hhbGxJdGVtKGlucHV0OiBUKTogQXR0cmlidXRlTWFwIHtcbiAgICByZXR1cm4gbWFyc2hhbGxlci5tYXJzaGFsbEl0ZW0odGhpcy5zZXJpYWxpemVWYWx1ZSgpLCBpbnB1dCk7XG4gIH1cbiAgcHVibGljIHVubWFyc2hhbGxJdGVtKGlucHV0OiBBdHRyaWJ1dGVNYXApOiBUIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLnNlcmlhbGl6ZVZhbHVlKCk7XG4gICAgY29uc3QgcmV0OiBUID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbTxUPihzY2hlbWEsIGlucHV0KTtcbiAgICAvLyBJdCBzZWVtcyB0aGF0IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW0gaGFzIGEgYnVnLi4uXG4gICAgT2JqZWN0LmtleXModGhpcy5zaGFwZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAocmV0W2tleV0gPT09IHZvaWQgMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFZhbHVlIGZvciBwcm9wZXJ0eSAke2tleX0gaXMgdW5leHBlY3RlZC5cXG5FeHBlY3RlZDogJHtKU09OLnN0cmluZ2lmeShzY2hlbWFba2V5XSl9XFxuQWN0dWFsOiAke0pTT04uc3RyaW5naWZ5KGlucHV0W2tleV0pfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG59XG4iXX0=