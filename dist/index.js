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
exports.object = exports.ObjectSchema = exports.nullable = exports.set = exports.map = exports.array = exports.string = exports.number = exports.date = exports.boolean = exports.buffer = exports.Schema = void 0;
const marshaller = __importStar(require("@aws/dynamodb-data-marshaller"));
// import {unmarshallItem, marshallValue} from "@aws/dynamodb-data-marshaller";
/**
 * Schema
 * @group Core
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
 * @group Primitive Schema
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
 * @group Primitive Schema
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
 * @group Primitive Schema
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
 * @group Primitive Schema
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
 * @group Primitive Schema
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
 * @group Combinator
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
 * @group Combinator
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
 * @group Combinator
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
 * @group Combinator
 */
function nullable(item) {
    return new NullableSchema(item);
}
exports.nullable = nullable;
/**
 * Object Schema
 * @group Core
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ObjectSchema extends Schema {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(schema) {
        super();
        this.shape = schema;
    }
    static fromRecord(schema) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    extendField(name, schema) {
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
/**
 * Object Schema
 * @group Combinator
 */
function object(item) {
    return ObjectSchema.fromRecord(item);
}
exports.object = object;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHSCwwRUFBNEQ7QUFDNUQsK0VBQStFO0FBRS9FOzs7R0FHRztBQUNILE1BQXNCLE1BQU07Q0FJM0I7QUFKRCx3QkFJQztBQVVELE1BQU0sWUFBYSxTQUFRLE1BQXFDO0lBQzlEO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNJLE1BQU0sTUFBTSxHQUFnRCxHQUFHLEVBQUUsQ0FDdEUsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQURSLFFBQUEsTUFBTSxVQUNFO0FBRXJCLE1BQU0sYUFBYyxTQUFRLE1BQWU7SUFDekM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDN0IsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0ksTUFBTSxPQUFPLEdBQTBCLEdBQUcsRUFBRSxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7QUFBM0QsUUFBQSxPQUFPLFdBQW9EO0FBRXhFLE1BQU0sVUFBVyxTQUFRLE1BQVk7SUFDbkM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDMUIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0ksTUFBTSxJQUFJLEdBQXVCLEdBQUcsRUFBRSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7QUFBbEQsUUFBQSxJQUFJLFFBQThDO0FBRS9ELE1BQU0sWUFBYSxTQUFRLE1BQWM7SUFDdkM7UUFD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RyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQ2Isc0JBQXNCLEdBQUcsOEJBQThCLElBQUksQ0FBQyxTQUFTLENBQ25FLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FDWixhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FDM0MsQ0FBQzthQUNIO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQXBFRCxvQ0FvRUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFnQixNQUFNLENBQWdDLElBQXVDO0lBQzNGLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBSSxJQUFJLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBRkQsd0JBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFR5cGUgc2FmZSBzY2hlbWEgZm9yIER5bmFtb0RCLlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlVmFsdWUsIEF0dHJpYnV0ZU1hcCB9IGZyb20gXCJhd3Mtc2RrL2NsaWVudHMvZHluYW1vZGJcIjtcbmltcG9ydCAqIGFzIG1hcnNoYWxsZXIgZnJvbSBcIkBhd3MvZHluYW1vZGItZGF0YS1tYXJzaGFsbGVyXCI7XG4vLyBpbXBvcnQge3VubWFyc2hhbGxJdGVtLCBtYXJzaGFsbFZhbHVlfSBmcm9tIFwiQGF3cy9keW5hbW9kYi1kYXRhLW1hcnNoYWxsZXJcIjtcblxuLyoqXG4gKiBTY2hlbWFcbiAqIEBncm91cCBDb3JlXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTY2hlbWE8VD4ge1xuICAvKiogQGhpZGRlbiAqL1xuICByZWFkb25seSBfSV9BTV9GT09MX0VOT1VHSF9UT19BQ0NFU1NfVEhJUyE6IFQ7XG4gIGFic3RyYWN0IHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlO1xufVxuXG4vKipcbiAqIEluZmVyIHR5cGUgb2YgU2NoZW1hLlxuICogQGdyb3VwIENvcmVcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIGluZmVyPFMgZXh0ZW5kcyBTY2hlbWE8YW55Pj4gPVxuICBTW1wiX0lfQU1fRk9PTF9FTk9VR0hfVE9fQUNDRVNTX1RISVNcIl07XG5cbmNsYXNzIEJpbmFyeVNjaGVtYSBleHRlbmRzIFNjaGVtYTxBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldz4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJCaW5hcnlcIiB9O1xuICB9XG59XG5cbi8qKlxuICogQmluYXJ5IFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJ1ZmZlcjogKCkgPT4gU2NoZW1hPEFycmF5QnVmZmVyVmlldyB8IEFycmF5QnVmZmVyPiA9ICgpID0+XG4gIG5ldyBCaW5hcnlTY2hlbWEoKTtcblxuY2xhc3MgQm9vbGVhblNjaGVtYSBleHRlbmRzIFNjaGVtYTxib29sZWFuPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIkJvb2xlYW5cIiB9O1xuICB9XG59XG5cbi8qKlxuICogQm9vbGVhbiBTY2hlbWFcbiAqIEBncm91cCBQcmltaXRpdmUgU2NoZW1hXG4gKi9cbmV4cG9ydCBjb25zdCBib29sZWFuOiAoKSA9PiBTY2hlbWE8Ym9vbGVhbj4gPSAoKSA9PiBuZXcgQm9vbGVhblNjaGVtYSgpO1xuXG5jbGFzcyBEYXRlU2NoZW1hIGV4dGVuZHMgU2NoZW1hPERhdGU+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiRGF0ZVwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBEYXRlIFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGRhdGU6ICgpID0+IFNjaGVtYTxEYXRlPiA9ICgpID0+IG5ldyBEYXRlU2NoZW1hKCk7XG5cbmNsYXNzIE51bWJlclNjaGVtYSBleHRlbmRzIFNjaGVtYTxudW1iZXI+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiTnVtYmVyXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIE51bWJlciBTY2hlbWEuXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgbnVtYmVyOiAoKSA9PiBTY2hlbWE8bnVtYmVyPiA9ICgpID0+IG5ldyBOdW1iZXJTY2hlbWEoKTtcblxuY2xhc3MgU3RyaW5nU2NoZW1hIGV4dGVuZHMgU2NoZW1hPHN0cmluZz4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJTdHJpbmdcIiB9O1xuICB9XG59XG5cbi8qKlxuICogU3RyaW5nIFNjaGVtYS5cbiAqIEBncm91cCBQcmltaXRpdmUgU2NoZW1hXG4gKi9cbmV4cG9ydCBjb25zdCBzdHJpbmc6ICgpID0+IFNjaGVtYTxzdHJpbmc+ID0gKCkgPT4gbmV3IFN0cmluZ1NjaGVtYSgpO1xuXG5jbGFzcyBBcnJheVNjaGVtYTxUPiBleHRlbmRzIFNjaGVtYTxUW10+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkxpc3RcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMuX3NjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIEFycmF5IFNjaGVtYVxuICogQGdyb3VwIENvbWJpbmF0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFycmF5PFQ+KGl0ZW06IFNjaGVtYTxUPik6IFNjaGVtYTxUW10+IHtcbiAgcmV0dXJuIG5ldyBBcnJheVNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgTWFwU2NoZW1hPFQ+IGV4dGVuZHMgU2NoZW1hPE1hcDxzdHJpbmcsIFQ+PiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJNYXBcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMuX3NjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgfTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcCBTY2hlbWFcbiAqIEBncm91cCBDb21iaW5hdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXA8VD4oaXRlbTogU2NoZW1hPFQ+KTogU2NoZW1hPE1hcDxzdHJpbmcsIFQ+PiB7XG4gIHJldHVybiBuZXcgTWFwU2NoZW1hKGl0ZW0pO1xufVxuXG5jbGFzcyBTZXRTY2hlbWE8XG4gIFQgZXh0ZW5kcyBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyB8IG51bWJlciB8IHN0cmluZ1xuPiBleHRlbmRzIFNjaGVtYTxTZXQ8VD4+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuXG4gIHByaXZhdGUgbWVtYmVyVHlwZSgpOiBcIlN0cmluZ1wiIHwgXCJOdW1iZXJcIiB8IFwiQmluYXJ5XCIge1xuICAgIGlmICh0aGlzLl9zY2hlbWEgaW5zdGFuY2VvZiBCaW5hcnlTY2hlbWEpIHtcbiAgICAgIHJldHVybiBcIkJpbmFyeVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgTnVtYmVyU2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJOdW1iZXJcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NjaGVtYSBpbnN0YW5jZW9mIFN0cmluZ1NjaGVtYSkge1xuICAgICAgcmV0dXJuIFwiU3RyaW5nXCI7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgU2V0XCIpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiU2V0XCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLm1lbWJlclR5cGUoKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogU2V0IFNjaGVtYVxuICogQGdyb3VwIENvbWJpbmF0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldDxUIGV4dGVuZHMgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcgfCBudW1iZXIgfCBzdHJpbmc+KFxuICBpdGVtOiBTY2hlbWE8VD5cbik6IFNjaGVtYTxTZXQ8VD4+IHtcbiAgcmV0dXJuIG5ldyBTZXRTY2hlbWEoaXRlbSk7XG59XG5cbmNsYXNzIE51bGxhYmxlU2NoZW1hPFQ+IGV4dGVuZHMgU2NoZW1hPFQgfCBudWxsPiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cblxuICBwcml2YXRlIG1hcnNoYWxsKGlucHV0OiBUIHwgbnVsbCk6IEF0dHJpYnV0ZVZhbHVlIHtcbiAgICBpZiAoaW5wdXQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIE5VTEw6IHRydWUsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHNlcmlhbGl6ZWQ6IEF0dHJpYnV0ZVZhbHVlIHwgdW5kZWZpbmVkID0gbWFyc2hhbGxlci5tYXJzaGFsbFZhbHVlKFxuICAgICAgdGhpcy5fc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSxcbiAgICAgIGlucHV0XG4gICAgKTtcbiAgICBpZiAoc2VyaWFsaXplZCA9PT0gdm9pZCAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGYWlsZWQgdG8gbWFyc2hhbGxWYWx1ZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcmlhbGl6ZWQ7XG4gIH1cblxuICBwcml2YXRlIHVubWFyc2hhbGwoaW5wdXQ6IEF0dHJpYnV0ZVZhbHVlKTogVCB8IG51bGwge1xuICAgIGlmIChcIk5VTExcIiBpbiBpbnB1dCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGRlc2VyaWFsaXplZDogeyBmb286IFQgfSA9IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW0oXG4gICAgICB7IGZvbzogdGhpcy5fc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSB9LFxuICAgICAgeyBmb286IGlucHV0IH1cbiAgICApO1xuICAgIHJldHVybiBkZXNlcmlhbGl6ZWQuZm9vO1xuICB9XG5cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJDdXN0b21cIixcbiAgICAgIG1hcnNoYWxsOiB0aGlzLm1hcnNoYWxsLmJpbmQodGhpcyksXG4gICAgICB1bm1hcnNoYWxsOiB0aGlzLnVubWFyc2hhbGwuYmluZCh0aGlzKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogTnVsbGFibGUgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbnVsbGFibGU8VD4oaXRlbTogU2NoZW1hPFQ+KTogU2NoZW1hPFQgfCBudWxsPiB7XG4gIHJldHVybiBuZXcgTnVsbGFibGVTY2hlbWEoaXRlbSk7XG59XG5cbi8qKiBUeXBlIGZvciBgeyAuLi50LCAuLi52IH1gXG4gKiBAZ3JvdXAgSGVscGVyXG4gKi9cbmV4cG9ydCB0eXBlIE1lcmdlZDxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgVCBleHRlbmRzIFJlY29yZDxhbnksIGFueT4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIFYgZXh0ZW5kcyBSZXF1aXJlZDxSZWNvcmQ8YW55LCBhbnk+PlxuPiA9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHsgW0sgaW4ga2V5b2YgVF06IEsgZXh0ZW5kcyBrZXlvZiBWID8gYW55IDogVFtLXSB9ICYgVjtcblxuLyoqXG4gKiBPYmplY3QgU2NoZW1hXG4gKiBAZ3JvdXAgQ29yZVxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNsYXNzIE9iamVjdFNjaGVtYTxUIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55Pj4gZXh0ZW5kcyBTY2hlbWE8VD4ge1xuICAvKiogUmV0dXJucyBzaGFwZSBvZiB0aGUgU2NoZW1hLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNoYXBlITogeyBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+IH07XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHByaXZhdGUgY29uc3RydWN0b3Ioc2NoZW1hOiB7IFtLIGluIGtleW9mIFRdOiBTY2hlbWE8VFtLXT4gfSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zaGFwZSA9IHNjaGVtYTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVJlY29yZDxUPihzY2hlbWE6IHsgW0sgaW4ga2V5b2YgVF06IFNjaGVtYTxUW0tdPiB9KSA6IE9iamVjdFNjaGVtYTx7IFtLIGluIGtleW9mIFRdOiBUW0tdIH0+IHtcbiAgICByZXR1cm4gbmV3IE9iamVjdFNjaGVtYShzY2hlbWEpO1xuICB9XG5cbiAgLyoqIEFzaWduIHJlcXVpcmVkIGZpZWxkLlxuICAgKlxuICAgKiBOb3RlIHRoYXQgYFNjaGVtYWAgY2Fubm90IGhhbmRsZSBvYmplY3RzIHdpdGggYW55IG9wdGlvbmFsIGZpZWxkcy5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHNcbiAgICogT2JqZWN0U2NoZW1hLm9iamVjdCgpXG4gICAqICAgLmV4dGVuZEZpZWxkPHsgZm9vOiBzdHJpbmcgfT4oXCJmb29cIiwgc3RyaW5nKCkpXG4gICAqICAgLmV4dGVuZEZpZWxkPHsgcmVhZG9ubHkgYmFyOiBudW1iZXIgfT4oXCJiYXJcIiwgbnVtYmVyKCkpXG4gICAqIC8vID0+IFJldHVybnMgU2NoZW1hIGZvciBgeyBmb286IHN0cmluZzsgcmVhZG9ubHkgYmFyOiBudW1iZXIgfWBcbiAgICogYGBgXG4gICAqL1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICBwdWJsaWMgZXh0ZW5kRmllbGQ8SyBleHRlbmRzIHN0cmluZywgVj4oXG4gICAgbmFtZTogSyxcbiAgICBzY2hlbWE6IFNjaGVtYTxWPlxuICApOiBPYmplY3RTY2hlbWE8TWVyZ2VkPFQsIHsgWyBrZXkgaW4gSyBdOiBWIH0+PiB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTY2hlbWE8TWVyZ2VkPFQsIHsgWyBrZXkgaW4gSyBdOiBWIH0+Pih7XG4gICAgICAuLi50aGlzLnNoYXBlLFxuICAgICAgW25hbWVdOiBzY2hlbWEsXG4gICAgfSk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZVZhbHVlKCk6IG1hcnNoYWxsZXIuU2NoZW1hIHtcbiAgICByZXR1cm4gT2JqZWN0LmZyb21FbnRyaWVzKFxuICAgICAgT2JqZWN0LmVudHJpZXModGhpcy5zaGFwZSkubWFwKChba2V5LCBzY2hlbWFdKSA9PiBbXG4gICAgICAgIGtleSxcbiAgICAgICAgc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSxcbiAgICAgIF0pXG4gICAgKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkRvY3VtZW50XCIsXG4gICAgICBtZW1iZXJzOiB0aGlzLnNlcmlhbGl6ZVZhbHVlKCksXG4gICAgfTtcbiAgfVxuICBwdWJsaWMgbWFyc2hhbGxJdGVtKGlucHV0OiBUKTogQXR0cmlidXRlTWFwIHtcbiAgICByZXR1cm4gbWFyc2hhbGxlci5tYXJzaGFsbEl0ZW0odGhpcy5zZXJpYWxpemVWYWx1ZSgpLCBpbnB1dCk7XG4gIH1cbiAgcHVibGljIHVubWFyc2hhbGxJdGVtKGlucHV0OiBBdHRyaWJ1dGVNYXApOiBUIHtcbiAgICBjb25zdCBzY2hlbWEgPSB0aGlzLnNlcmlhbGl6ZVZhbHVlKCk7XG4gICAgY29uc3QgcmV0OiBUID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbTxUPihzY2hlbWEsIGlucHV0KTtcbiAgICAvLyBJdCBzZWVtcyB0aGF0IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW0gaGFzIGEgYnVnLi4uXG4gICAgT2JqZWN0LmtleXModGhpcy5zaGFwZSkuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgICBpZiAocmV0W2tleV0gPT09IHZvaWQgMCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFZhbHVlIGZvciBwcm9wZXJ0eSAke2tleX0gaXMgdW5leHBlY3RlZC5cXG5FeHBlY3RlZDogJHtKU09OLnN0cmluZ2lmeShcbiAgICAgICAgICAgIHNjaGVtYVtrZXldXG4gICAgICAgICAgKX1cXG5BY3R1YWw6ICR7SlNPTi5zdHJpbmdpZnkoaW5wdXRba2V5XSl9YFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByZXQ7XG4gIH1cbn1cblxuLyoqXG4gKiBPYmplY3QgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gb2JqZWN0PFQgZXh0ZW5kcyBSZWNvcmQ8c3RyaW5nLCBhbnk+PihpdGVtOiB7IFsgSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+IH0pIDogT2JqZWN0U2NoZW1hPFQ+IHtcbiAgcmV0dXJuIE9iamVjdFNjaGVtYS5mcm9tUmVjb3JkPFQ+KGl0ZW0pO1xufVxuIl19