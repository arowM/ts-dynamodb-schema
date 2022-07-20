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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function object(item) {
    return ObjectSchema.fromRecord(item);
}
exports.object = object;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFJSCwwRUFBNEQ7QUFDNUQsK0VBQStFO0FBRS9FOzs7R0FHRztBQUNILE1BQXNCLE1BQU07Q0FJM0I7QUFKRCx3QkFJQztBQVVELE1BQU0sWUFBYSxTQUFRLE1BQXFDO0lBQzlEO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUFDO0lBQzVCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNJLE1BQU0sTUFBTSxHQUFnRCxHQUFHLEVBQUUsQ0FDdEUsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQURSLFFBQUEsTUFBTSxVQUNFO0FBRXJCLE1BQU0sYUFBYyxTQUFRLE1BQWU7SUFDekM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7SUFDN0IsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0ksTUFBTSxPQUFPLEdBQTBCLEdBQUcsRUFBRSxDQUFDLElBQUksYUFBYSxFQUFFLENBQUM7QUFBM0QsUUFBQSxPQUFPLFdBQW9EO0FBRXhFLE1BQU0sVUFBVyxTQUFRLE1BQVk7SUFDbkM7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUM7SUFDMUIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0ksTUFBTSxJQUFJLEdBQXVCLEdBQUcsRUFBRSxDQUFDLElBQUksVUFBVSxFQUFFLENBQUM7QUFBbEQsUUFBQSxJQUFJLFFBQThDO0FBRS9ELE1BQU0sWUFBYSxTQUFRLE1BQWM7SUFDdkM7UUFD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RyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQ2Isc0JBQXNCLEdBQUcsOEJBQThCLElBQUksQ0FBQyxTQUFTLENBQ25FLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FDWixhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FDM0MsQ0FBQzthQUNIO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQXRFRCxvQ0FzRUM7QUFFRDs7O0dBR0c7QUFDSCw4REFBOEQ7QUFDOUQsU0FBZ0IsTUFBTSxDQUFnQyxJQUVyRDtJQUNDLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBSSxJQUFJLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBSkQsd0JBSUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFR5cGUgc2FmZSBzY2hlbWEgZm9yIER5bmFtb0RCLlxuICogQG1vZHVsZVxuICovXG5cbmltcG9ydCB0eXBlIHsgQXR0cmlidXRlVmFsdWUgfSBmcm9tIFwiYXdzLXNkay9jbGllbnRzL2R5bmFtb2RiXCI7XG5pbXBvcnQgdHlwZSAqIGFzIGNsaWVudHMgZnJvbSBcImF3cy1zZGsvY2xpZW50cy9keW5hbW9kYlwiO1xuaW1wb3J0ICogYXMgbWFyc2hhbGxlciBmcm9tIFwiQGF3cy9keW5hbW9kYi1kYXRhLW1hcnNoYWxsZXJcIjtcbi8vIGltcG9ydCB7dW5tYXJzaGFsbEl0ZW0sIG1hcnNoYWxsVmFsdWV9IGZyb20gXCJAYXdzL2R5bmFtb2RiLWRhdGEtbWFyc2hhbGxlclwiO1xuXG4vKipcbiAqIFNjaGVtYVxuICogQGdyb3VwIENvcmVcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFNjaGVtYTxUPiB7XG4gIC8qKiBAaGlkZGVuICovXG4gIHJlYWRvbmx5IF9JX0FNX0ZPT0xfRU5PVUdIX1RPX0FDQ0VTU19USElTITogVDtcbiAgYWJzdHJhY3Qgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGU7XG59XG5cbi8qKlxuICogSW5mZXIgdHlwZSBvZiBTY2hlbWEuXG4gKiBAZ3JvdXAgQ29yZVxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IHR5cGUgaW5mZXI8UyBleHRlbmRzIFNjaGVtYTxhbnk+PiA9XG4gIFNbXCJfSV9BTV9GT09MX0VOT1VHSF9UT19BQ0NFU1NfVEhJU1wiXTtcblxuY2xhc3MgQmluYXJ5U2NoZW1hIGV4dGVuZHMgU2NoZW1hPEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3PiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIkJpbmFyeVwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBCaW5hcnkgU2NoZW1hXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgYnVmZmVyOiAoKSA9PiBTY2hlbWE8QXJyYXlCdWZmZXJWaWV3IHwgQXJyYXlCdWZmZXI+ID0gKCkgPT5cbiAgbmV3IEJpbmFyeVNjaGVtYSgpO1xuXG5jbGFzcyBCb29sZWFuU2NoZW1hIGV4dGVuZHMgU2NoZW1hPGJvb2xlYW4+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiQm9vbGVhblwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBCb29sZWFuIFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJvb2xlYW46ICgpID0+IFNjaGVtYTxib29sZWFuPiA9ICgpID0+IG5ldyBCb29sZWFuU2NoZW1hKCk7XG5cbmNsYXNzIERhdGVTY2hlbWEgZXh0ZW5kcyBTY2hlbWE8RGF0ZT4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJEYXRlXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIERhdGUgU2NoZW1hXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgZGF0ZTogKCkgPT4gU2NoZW1hPERhdGU+ID0gKCkgPT4gbmV3IERhdGVTY2hlbWEoKTtcblxuY2xhc3MgTnVtYmVyU2NoZW1hIGV4dGVuZHMgU2NoZW1hPG51bWJlcj4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJOdW1iZXJcIiB9O1xuICB9XG59XG5cbi8qKlxuICogTnVtYmVyIFNjaGVtYS5cbiAqIEBncm91cCBQcmltaXRpdmUgU2NoZW1hXG4gKi9cbmV4cG9ydCBjb25zdCBudW1iZXI6ICgpID0+IFNjaGVtYTxudW1iZXI+ID0gKCkgPT4gbmV3IE51bWJlclNjaGVtYSgpO1xuXG5jbGFzcyBTdHJpbmdTY2hlbWEgZXh0ZW5kcyBTY2hlbWE8c3RyaW5nPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIlN0cmluZ1wiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBTdHJpbmcgU2NoZW1hLlxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IHN0cmluZzogKCkgPT4gU2NoZW1hPHN0cmluZz4gPSAoKSA9PiBuZXcgU3RyaW5nU2NoZW1hKCk7XG5cbmNsYXNzIEFycmF5U2NoZW1hPFQ+IGV4dGVuZHMgU2NoZW1hPFRbXT4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiTGlzdFwiLFxuICAgICAgbWVtYmVyVHlwZTogdGhpcy5fc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogQXJyYXkgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gYXJyYXk8VD4oaXRlbTogU2NoZW1hPFQ+KTogU2NoZW1hPFRbXT4ge1xuICByZXR1cm4gbmV3IEFycmF5U2NoZW1hKGl0ZW0pO1xufVxuXG5jbGFzcyBNYXBTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8TWFwPHN0cmluZywgVD4+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIk1hcFwiLFxuICAgICAgbWVtYmVyVHlwZTogdGhpcy5fc2NoZW1hLnNlcmlhbGl6ZUl0ZW0oKSxcbiAgICB9O1xuICB9XG59XG5cbi8qKlxuICogTWFwIFNjaGVtYVxuICogQGdyb3VwIENvbWJpbmF0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcDxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8TWFwPHN0cmluZywgVD4+IHtcbiAgcmV0dXJuIG5ldyBNYXBTY2hlbWEoaXRlbSk7XG59XG5cbmNsYXNzIFNldFNjaGVtYTxcbiAgVCBleHRlbmRzIEFycmF5QnVmZmVyIHwgQXJyYXlCdWZmZXJWaWV3IHwgbnVtYmVyIHwgc3RyaW5nXG4+IGV4dGVuZHMgU2NoZW1hPFNldDxUPj4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG5cbiAgcHJpdmF0ZSBtZW1iZXJUeXBlKCk6IFwiU3RyaW5nXCIgfCBcIk51bWJlclwiIHwgXCJCaW5hcnlcIiB7XG4gICAgaWYgKHRoaXMuX3NjaGVtYSBpbnN0YW5jZW9mIEJpbmFyeVNjaGVtYSkge1xuICAgICAgcmV0dXJuIFwiQmluYXJ5XCI7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY2hlbWEgaW5zdGFuY2VvZiBOdW1iZXJTY2hlbWEpIHtcbiAgICAgIHJldHVybiBcIk51bWJlclwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgU3RyaW5nU2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJTdHJpbmdcIjtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBTZXRcIik7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJTZXRcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMubWVtYmVyVHlwZSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0PFQgZXh0ZW5kcyBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyB8IG51bWJlciB8IHN0cmluZz4oXG4gIGl0ZW06IFNjaGVtYTxUPlxuKTogU2NoZW1hPFNldDxUPj4ge1xuICByZXR1cm4gbmV3IFNldFNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgTnVsbGFibGVTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuXG4gIHByaXZhdGUgbWFyc2hhbGwoaW5wdXQ6IFQgfCBudWxsKTogQXR0cmlidXRlVmFsdWUge1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgTlVMTDogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc2VyaWFsaXplZDogQXR0cmlidXRlVmFsdWUgfCB1bmRlZmluZWQgPSBtYXJzaGFsbGVyLm1hcnNoYWxsVmFsdWUoXG4gICAgICB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgICAgaW5wdXRcbiAgICApO1xuICAgIGlmIChzZXJpYWxpemVkID09PSB2b2lkIDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBtYXJzaGFsbFZhbHVlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgfVxuXG4gIHByaXZhdGUgdW5tYXJzaGFsbChpbnB1dDogQXR0cmlidXRlVmFsdWUpOiBUIHwgbnVsbCB7XG4gICAgaWYgKFwiTlVMTFwiIGluIGlucHV0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZGVzZXJpYWxpemVkOiB7IGZvbzogVCB9ID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbShcbiAgICAgIHsgZm9vOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpIH0sXG4gICAgICB7IGZvbzogaW5wdXQgfVxuICAgICk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZC5mb287XG4gIH1cblxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkN1c3RvbVwiLFxuICAgICAgbWFyc2hhbGw6IHRoaXMubWFyc2hhbGwuYmluZCh0aGlzKSxcbiAgICAgIHVubWFyc2hhbGw6IHRoaXMudW5tYXJzaGFsbC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBOdWxsYWJsZSBTY2hlbWFcbiAqIEBncm91cCBDb21iaW5hdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBudWxsYWJsZTxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmV0dXJuIG5ldyBOdWxsYWJsZVNjaGVtYShpdGVtKTtcbn1cblxuLyoqIEBncm91cCBIZWxwZXJcbiAqL1xuZXhwb3J0IHR5cGUgQXR0cmlidXRlTWFwID0gY2xpZW50cy5BdHRyaWJ1dGVNYXA7XG5cbi8qKiBUeXBlIGZvciBgeyAuLi50LCAuLi52IH1gXG4gKiBAZ3JvdXAgSGVscGVyXG4gKi9cbmV4cG9ydCB0eXBlIE1lcmdlZDxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgVCBleHRlbmRzIFJlY29yZDxhbnksIGFueT4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIFYgZXh0ZW5kcyBSZXF1aXJlZDxSZWNvcmQ8YW55LCBhbnk+PlxuPiA9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHsgW0sgaW4ga2V5b2YgVF06IEsgZXh0ZW5kcyBrZXlvZiBWID8gYW55IDogVFtLXSB9ICYgVjtcblxuLyoqXG4gKiBPYmplY3QgU2NoZW1hXG4gKiBAZ3JvdXAgQ29yZVxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNsYXNzIE9iamVjdFNjaGVtYTxUIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55Pj4gZXh0ZW5kcyBTY2hlbWE8VD4ge1xuICAvKiogUmV0dXJucyBzaGFwZSBvZiB0aGUgU2NoZW1hLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNoYXBlITogeyBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+IH07XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHByaXZhdGUgY29uc3RydWN0b3Ioc2NoZW1hOiB7IFtLIGluIGtleW9mIFRdOiBTY2hlbWE8VFtLXT4gfSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zaGFwZSA9IHNjaGVtYTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVJlY29yZDxUPihzY2hlbWE6IHtcbiAgICBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+O1xuICB9KTogT2JqZWN0U2NoZW1hPHsgW0sgaW4ga2V5b2YgVF06IFRbS10gfT4ge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U2NoZW1hKHNjaGVtYSk7XG4gIH1cblxuICAvKiogQXNpZ24gcmVxdWlyZWQgZmllbGQuXG4gICAqXG4gICAqIE5vdGUgdGhhdCBgU2NoZW1hYCBjYW5ub3QgaGFuZGxlIG9iamVjdHMgd2l0aCBhbnkgb3B0aW9uYWwgZmllbGRzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiBPYmplY3RTY2hlbWEub2JqZWN0KClcbiAgICogICAuZXh0ZW5kRmllbGQ8eyBmb286IHN0cmluZyB9PihcImZvb1wiLCBzdHJpbmcoKSlcbiAgICogICAuZXh0ZW5kRmllbGQ8eyByZWFkb25seSBiYXI6IG51bWJlciB9PihcImJhclwiLCBudW1iZXIoKSlcbiAgICogLy8gPT4gUmV0dXJucyBTY2hlbWEgZm9yIGB7IGZvbzogc3RyaW5nOyByZWFkb25seSBiYXI6IG51bWJlciB9YFxuICAgKiBgYGBcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHB1YmxpYyBleHRlbmRGaWVsZDxLIGV4dGVuZHMgc3RyaW5nLCBWPihcbiAgICBuYW1lOiBLLFxuICAgIHNjaGVtYTogU2NoZW1hPFY+XG4gICk6IE9iamVjdFNjaGVtYTxNZXJnZWQ8VCwgeyBba2V5IGluIEtdOiBWIH0+PiB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTY2hlbWE8TWVyZ2VkPFQsIHsgW2tleSBpbiBLXTogViB9Pj4oe1xuICAgICAgLi4udGhpcy5zaGFwZSxcbiAgICAgIFtuYW1lXTogc2NoZW1hLFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVWYWx1ZSgpOiBtYXJzaGFsbGVyLlNjaGVtYSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuc2hhcGUpLm1hcCgoW2tleSwgc2NoZW1hXSkgPT4gW1xuICAgICAgICBrZXksXG4gICAgICAgIHNjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgICBdKVxuICAgICk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJEb2N1bWVudFwiLFxuICAgICAgbWVtYmVyczogdGhpcy5zZXJpYWxpemVWYWx1ZSgpLFxuICAgIH07XG4gIH1cbiAgcHVibGljIG1hcnNoYWxsSXRlbShpbnB1dDogVCk6IEF0dHJpYnV0ZU1hcCB7XG4gICAgcmV0dXJuIG1hcnNoYWxsZXIubWFyc2hhbGxJdGVtKHRoaXMuc2VyaWFsaXplVmFsdWUoKSwgaW5wdXQpO1xuICB9XG4gIHB1YmxpYyB1bm1hcnNoYWxsSXRlbShpbnB1dDogQXR0cmlidXRlTWFwKTogVCB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5zZXJpYWxpemVWYWx1ZSgpO1xuICAgIGNvbnN0IHJldDogVCA9IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW08VD4oc2NoZW1hLCBpbnB1dCk7XG4gICAgLy8gSXQgc2VlbXMgdGhhdCBtYXJzaGFsbGVyLnVubWFyc2hhbGxJdGVtIGhhcyBhIGJ1Zy4uLlxuICAgIE9iamVjdC5rZXlzKHRoaXMuc2hhcGUpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHJldFtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBWYWx1ZSBmb3IgcHJvcGVydHkgJHtrZXl9IGlzIHVuZXhwZWN0ZWQuXFxuRXhwZWN0ZWQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBzY2hlbWFba2V5XVxuICAgICAgICAgICl9XFxuQWN0dWFsOiAke0pTT04uc3RyaW5naWZ5KGlucHV0W2tleV0pfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG59XG5cbi8qKlxuICogT2JqZWN0IFNjaGVtYVxuICogQGdyb3VwIENvbWJpbmF0b3JcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBvYmplY3Q8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4+KGl0ZW06IHtcbiAgW0sgaW4ga2V5b2YgVF06IFNjaGVtYTxUW0tdPjtcbn0pOiBPYmplY3RTY2hlbWE8VD4ge1xuICByZXR1cm4gT2JqZWN0U2NoZW1hLmZyb21SZWNvcmQ8VD4oaXRlbSk7XG59XG4iXX0=