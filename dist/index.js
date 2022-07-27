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
exports.object = exports.ObjectSchema = exports.nullable = exports.set = exports.map = exports.array = exports.string = exports.bigInt = exports.number = exports.date = exports.boolean = exports.buffer = exports.Schema = void 0;
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
class BigIntSchema extends Schema {
    constructor() {
        super();
    }
    serializeItem() {
        return {
            type: "Custom",
            marshall(input) {
                return { "N": input.toString() };
            },
            unmarshall(input) {
                if ("N" in input) {
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
const bigInt = () => new BigIntSchema();
exports.bigInt = bigInt;
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
        if (this._schema instanceof BigIntSchema) {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function object(item) {
    return ObjectSchema.fromRecord(item);
}
exports.object = object;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCwwRUFBNEQ7QUFDNUQsK0VBQStFO0FBRS9FOzs7R0FHRztBQUNILE1BQXNCLE1BQU07Q0FJM0I7QUFKRCx3QkFJQztBQVVELE1BQU0sWUFBYSxTQUFRLE1BQXFDO0lBQzlEO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNJLE1BQU0sTUFBTSxHQUFnRCxHQUFHLEVBQUUsQ0FDdEUsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQURSLFFBQUEsTUFBTSxVQUNFO0FBRXJCLE1BQU0sYUFBYyxTQUFRLE1BQWU7SUFDekM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDN0IsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0ksTUFBTSxPQUFPLEdBQTBCLEdBQUcsRUFBRSxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7QUFBM0QsUUFBQSxPQUFPLFdBQW9EO0FBRXhFLE1BQU0sVUFBVyxTQUFRLE1BQVk7SUFDbkM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDMUIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0ksTUFBTSxJQUFJLEdBQXVCLEdBQUcsRUFBRSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7QUFBbEQsUUFBQSxJQUFJLFFBQThDO0FBRS9ELE1BQU0sWUFBYSxTQUFRLE1BQWM7SUFDdkM7UUFD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QUFVLENBQUksSUFBSSxDQUFDLENBQUM7QUFDMUMsQ0FBQztBQUpELHdCQUlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUeXBlIHNhZmUgc2NoZW1hIGZvciBEeW5hbW9EQi5cbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZVZhbHVlIH0gZnJvbSBcImF3cy1zZGsvY2xpZW50cy9keW5hbW9kYlwiO1xuaW1wb3J0IHR5cGUgKiBhcyBjbGllbnRzIGZyb20gXCJhd3Mtc2RrL2NsaWVudHMvZHluYW1vZGJcIjtcbmltcG9ydCAqIGFzIG1hcnNoYWxsZXIgZnJvbSBcIkBhd3MvZHluYW1vZGItZGF0YS1tYXJzaGFsbGVyXCI7XG4vLyBpbXBvcnQge3VubWFyc2hhbGxJdGVtLCBtYXJzaGFsbFZhbHVlfSBmcm9tIFwiQGF3cy9keW5hbW9kYi1kYXRhLW1hcnNoYWxsZXJcIjtcblxuLyoqXG4gKiBTY2hlbWFcbiAqIEBncm91cCBDb3JlXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTY2hlbWE8VD4ge1xuICAvKiogQGhpZGRlbiAqL1xuICByZWFkb25seSBfSV9BTV9GT09MX0VOT1VHSF9UT19BQ0NFU1NfVEhJUyE6IFQ7XG4gIGFic3RyYWN0IHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlO1xufVxuXG4vKipcbiAqIEluZmVyIHR5cGUgb2YgU2NoZW1hLlxuICogQGdyb3VwIENvcmVcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIGluZmVyPFMgZXh0ZW5kcyBTY2hlbWE8YW55Pj4gPVxuICBTW1wiX0lfQU1fRk9PTF9FTk9VR0hfVE9fQUNDRVNTX1RISVNcIl07XG5cbmNsYXNzIEJpbmFyeVNjaGVtYSBleHRlbmRzIFNjaGVtYTxBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldz4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJCaW5hcnlcIiB9O1xuICB9XG59XG5cbi8qKlxuICogQmluYXJ5IFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJ1ZmZlcjogKCkgPT4gU2NoZW1hPEFycmF5QnVmZmVyVmlldyB8IEFycmF5QnVmZmVyPiA9ICgpID0+XG4gIG5ldyBCaW5hcnlTY2hlbWEoKTtcblxuY2xhc3MgQm9vbGVhblNjaGVtYSBleHRlbmRzIFNjaGVtYTxib29sZWFuPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIkJvb2xlYW5cIiB9O1xuICB9XG59XG5cbi8qKlxuICogQm9vbGVhbiBTY2hlbWFcbiAqIEBncm91cCBQcmltaXRpdmUgU2NoZW1hXG4gKi9cbmV4cG9ydCBjb25zdCBib29sZWFuOiAoKSA9PiBTY2hlbWE8Ym9vbGVhbj4gPSAoKSA9PiBuZXcgQm9vbGVhblNjaGVtYSgpO1xuXG5jbGFzcyBEYXRlU2NoZW1hIGV4dGVuZHMgU2NoZW1hPERhdGU+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiRGF0ZVwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBEYXRlIFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGRhdGU6ICgpID0+IFNjaGVtYTxEYXRlPiA9ICgpID0+IG5ldyBEYXRlU2NoZW1hKCk7XG5cbmNsYXNzIE51bWJlclNjaGVtYSBleHRlbmRzIFNjaGVtYTxudW1iZXI+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiTnVtYmVyXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIE51bWJlciBTY2hlbWEuXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgbnVtYmVyOiAoKSA9PiBTY2hlbWE8bnVtYmVyPiA9ICgpID0+IG5ldyBOdW1iZXJTY2hlbWEoKTtcblxuY2xhc3MgQmlnSW50U2NoZW1hIGV4dGVuZHMgU2NoZW1hPEJpZ0ludD4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiQ3VzdG9tXCIsXG4gICAgICBtYXJzaGFsbChpbnB1dDogQmlnSW50KSB7XG4gICAgICAgIHJldHVybiB7IFwiTlwiOiBpbnB1dC50b1N0cmluZygpIH07XG4gICAgICB9LFxuICAgICAgdW5tYXJzaGFsbChpbnB1dDogQXR0cmlidXRlVmFsdWUpIHtcbiAgICAgICAgaWYgKFwiTlwiIGluIGlucHV0KSB7XG4gICAgICAgICAgcmV0dXJuIEJpZ0ludChpbnB1dC5OKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBOdW1iZXJcIik7XG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBCaWdJbnQgU2NoZW1hLlxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJpZ0ludDogKCkgPT4gU2NoZW1hPEJpZ0ludD4gPSAoKSA9PiBuZXcgQmlnSW50U2NoZW1hKCk7XG5cbmNsYXNzIFN0cmluZ1NjaGVtYSBleHRlbmRzIFNjaGVtYTxzdHJpbmc+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiU3RyaW5nXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIFN0cmluZyBTY2hlbWEuXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3Qgc3RyaW5nOiAoKSA9PiBTY2hlbWE8c3RyaW5nPiA9ICgpID0+IG5ldyBTdHJpbmdTY2hlbWEoKTtcblxuY2xhc3MgQXJyYXlTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VFtdPiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJMaXN0XCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBBcnJheSBTY2hlbWFcbiAqIEBncm91cCBDb21iaW5hdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiB7XG4gIHJldHVybiBuZXcgQXJyYXlTY2hlbWEoaXRlbSk7XG59XG5cbmNsYXNzIE1hcFNjaGVtYTxUPiBleHRlbmRzIFNjaGVtYTxNYXA8c3RyaW5nLCBUPj4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiTWFwXCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwPFQ+KGl0ZW06IFNjaGVtYTxUPik6IFNjaGVtYTxNYXA8c3RyaW5nLCBUPj4ge1xuICByZXR1cm4gbmV3IE1hcFNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgU2V0U2NoZW1hPFxuICBUIGV4dGVuZHMgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcgfCBudW1iZXIgfCBCaWdJbnQgfCBzdHJpbmdcbj4gZXh0ZW5kcyBTY2hlbWE8U2V0PFQ+PiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cblxuICBwcml2YXRlIG1lbWJlclR5cGUoKTogXCJTdHJpbmdcIiB8IFwiTnVtYmVyXCIgfCBcIkJpbmFyeVwiIHtcbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgQmluYXJ5U2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJCaW5hcnlcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NjaGVtYSBpbnN0YW5jZW9mIE51bWJlclNjaGVtYSkge1xuICAgICAgcmV0dXJuIFwiTnVtYmVyXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY2hlbWEgaW5zdGFuY2VvZiBCaWdJbnRTY2hlbWEpIHtcbiAgICAgIHJldHVybiBcIk51bWJlclwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgU3RyaW5nU2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJTdHJpbmdcIjtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBTZXRcIik7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJTZXRcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMubWVtYmVyVHlwZSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0PFQgZXh0ZW5kcyBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyB8IG51bWJlciB8IEJpZ0ludCB8IHN0cmluZz4oXG4gIGl0ZW06IFNjaGVtYTxUPlxuKTogU2NoZW1hPFNldDxUPj4ge1xuICByZXR1cm4gbmV3IFNldFNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgTnVsbGFibGVTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuXG4gIHByaXZhdGUgbWFyc2hhbGwoaW5wdXQ6IFQgfCBudWxsKTogQXR0cmlidXRlVmFsdWUge1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgTlVMTDogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc2VyaWFsaXplZDogQXR0cmlidXRlVmFsdWUgfCB1bmRlZmluZWQgPSBtYXJzaGFsbGVyLm1hcnNoYWxsVmFsdWUoXG4gICAgICB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgICAgaW5wdXRcbiAgICApO1xuICAgIGlmIChzZXJpYWxpemVkID09PSB2b2lkIDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBtYXJzaGFsbFZhbHVlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgfVxuXG4gIHByaXZhdGUgdW5tYXJzaGFsbChpbnB1dDogQXR0cmlidXRlVmFsdWUpOiBUIHwgbnVsbCB7XG4gICAgaWYgKFwiTlVMTFwiIGluIGlucHV0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZGVzZXJpYWxpemVkOiB7IGZvbzogVCB9ID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbShcbiAgICAgIHsgZm9vOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpIH0sXG4gICAgICB7IGZvbzogaW5wdXQgfVxuICAgICk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZC5mb287XG4gIH1cblxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkN1c3RvbVwiLFxuICAgICAgbWFyc2hhbGw6IHRoaXMubWFyc2hhbGwuYmluZCh0aGlzKSxcbiAgICAgIHVubWFyc2hhbGw6IHRoaXMudW5tYXJzaGFsbC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBOdWxsYWJsZSBTY2hlbWFcbiAqIEBncm91cCBDb21iaW5hdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBudWxsYWJsZTxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmV0dXJuIG5ldyBOdWxsYWJsZVNjaGVtYShpdGVtKTtcbn1cblxuLyoqIEBncm91cCBIZWxwZXJcbiAqL1xuZXhwb3J0IHR5cGUgQXR0cmlidXRlTWFwID0gY2xpZW50cy5BdHRyaWJ1dGVNYXA7XG5cbi8qKiBUeXBlIGZvciBgeyAuLi50LCAuLi52IH1gXG4gKiBAZ3JvdXAgSGVscGVyXG4gKi9cbmV4cG9ydCB0eXBlIE1lcmdlZDxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgVCBleHRlbmRzIFJlY29yZDxhbnksIGFueT4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIFYgZXh0ZW5kcyBSZXF1aXJlZDxSZWNvcmQ8YW55LCBhbnk+PlxuPiA9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHsgW0sgaW4ga2V5b2YgVF06IEsgZXh0ZW5kcyBrZXlvZiBWID8gYW55IDogVFtLXSB9ICYgVjtcblxuLyoqXG4gKiBPYmplY3QgU2NoZW1hXG4gKiBAZ3JvdXAgQ29yZVxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNsYXNzIE9iamVjdFNjaGVtYTxUIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55Pj4gZXh0ZW5kcyBTY2hlbWE8VD4ge1xuICAvKiogUmV0dXJucyBzaGFwZSBvZiB0aGUgU2NoZW1hLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNoYXBlITogeyBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+IH07XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHByaXZhdGUgY29uc3RydWN0b3Ioc2NoZW1hOiB7IFtLIGluIGtleW9mIFRdOiBTY2hlbWE8VFtLXT4gfSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zaGFwZSA9IHNjaGVtYTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVJlY29yZDxUPihzY2hlbWE6IHtcbiAgICBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+O1xuICB9KTogT2JqZWN0U2NoZW1hPHsgW0sgaW4ga2V5b2YgVF06IFRbS10gfT4ge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U2NoZW1hKHNjaGVtYSk7XG4gIH1cblxuICAvKiogQXNpZ24gcmVxdWlyZWQgZmllbGQuXG4gICAqXG4gICAqIE5vdGUgdGhhdCBgU2NoZW1hYCBjYW5ub3QgaGFuZGxlIG9iamVjdHMgd2l0aCBhbnkgb3B0aW9uYWwgZmllbGRzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiBPYmplY3RTY2hlbWEub2JqZWN0KClcbiAgICogICAuZXh0ZW5kRmllbGQ8eyBmb286IHN0cmluZyB9PihcImZvb1wiLCBzdHJpbmcoKSlcbiAgICogICAuZXh0ZW5kRmllbGQ8eyByZWFkb25seSBiYXI6IG51bWJlciB9PihcImJhclwiLCBudW1iZXIoKSlcbiAgICogLy8gPT4gUmV0dXJucyBTY2hlbWEgZm9yIGB7IGZvbzogc3RyaW5nOyByZWFkb25seSBiYXI6IG51bWJlciB9YFxuICAgKiBgYGBcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHB1YmxpYyBleHRlbmRGaWVsZDxLIGV4dGVuZHMgc3RyaW5nLCBWPihcbiAgICBuYW1lOiBLLFxuICAgIHNjaGVtYTogU2NoZW1hPFY+XG4gICk6IE9iamVjdFNjaGVtYTxNZXJnZWQ8VCwgeyBba2V5IGluIEtdOiBWIH0+PiB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTY2hlbWE8TWVyZ2VkPFQsIHsgW2tleSBpbiBLXTogViB9Pj4oe1xuICAgICAgLi4udGhpcy5zaGFwZSxcbiAgICAgIFtuYW1lXTogc2NoZW1hLFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVWYWx1ZSgpOiBtYXJzaGFsbGVyLlNjaGVtYSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuc2hhcGUpLm1hcCgoW2tleSwgc2NoZW1hXSkgPT4gW1xuICAgICAgICBrZXksXG4gICAgICAgIHNjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgICBdKVxuICAgICk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJEb2N1bWVudFwiLFxuICAgICAgbWVtYmVyczogdGhpcy5zZXJpYWxpemVWYWx1ZSgpLFxuICAgIH07XG4gIH1cbiAgcHVibGljIG1hcnNoYWxsSXRlbShpbnB1dDogVCk6IEF0dHJpYnV0ZU1hcCB7XG4gICAgcmV0dXJuIG1hcnNoYWxsZXIubWFyc2hhbGxJdGVtKHRoaXMuc2VyaWFsaXplVmFsdWUoKSwgaW5wdXQpO1xuICB9XG4gIHB1YmxpYyB1bm1hcnNoYWxsSXRlbShpbnB1dDogQXR0cmlidXRlTWFwKTogVCB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5zZXJpYWxpemVWYWx1ZSgpO1xuICAgIGNvbnN0IHJldDogVCA9IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW08VD4oc2NoZW1hLCBpbnB1dCk7XG4gICAgLy8gSXQgc2VlbXMgdGhhdCBtYXJzaGFsbGVyLnVubWFyc2hhbGxJdGVtIGhhcyBhIGJ1Zy4uLlxuICAgIE9iamVjdC5rZXlzKHRoaXMuc2hhcGUpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHJldFtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBWYWx1ZSBmb3IgcHJvcGVydHkgJHtrZXl9IGlzIHVuZXhwZWN0ZWQuXFxuRXhwZWN0ZWQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBzY2hlbWFba2V5XVxuICAgICAgICAgICl9XFxuQWN0dWFsOiAke0pTT04uc3RyaW5naWZ5KGlucHV0W2tleV0pfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG59XG5cbi8qKlxuICogT2JqZWN0IFNjaGVtYVxuICogQGdyb3VwIENvbWJpbmF0b3JcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBvYmplY3Q8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4+KGl0ZW06IHtcbiAgW0sgaW4ga2V5b2YgVF06IFNjaGVtYTxUW0tdPjtcbn0pOiBPYmplY3RTY2hlbWE8VD4ge1xuICByZXR1cm4gT2JqZWN0U2NoZW1hLmZyb21SZWNvcmQ8VD4oaXRlbSk7XG59XG4iXX0=