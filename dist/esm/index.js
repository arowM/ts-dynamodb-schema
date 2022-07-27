/**
 * Type safe schema for DynamoDB.
 * @module
 */
import * as marshaller from "@aws/dynamodb-data-marshaller";
// import {unmarshallItem, marshallValue} from "@aws/dynamodb-data-marshaller";
/**
 * Schema
 * @group Core
 */
export class Schema {
}
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
export const buffer = () => new BinarySchema();
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
export const boolean = () => new BooleanSchema();
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
export const date = () => new DateSchema();
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
export const number = () => new NumberSchema();
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
export const bigInt = () => new BigIntSchema();
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
export const string = () => new StringSchema();
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
export function array(item) {
    return new ArraySchema(item);
}
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
export function map(item) {
    return new MapSchema(item);
}
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
export function set(item) {
    return new SetSchema(item);
}
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
export function nullable(item) {
    return new NullableSchema(item);
}
/**
 * Object Schema
 * @group Core
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ObjectSchema extends Schema {
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
/**
 * Object Schema
 * @group Combinator
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function object(item) {
    return ObjectSchema.fromRecord(item);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztHQUdHO0FBSUgsT0FBTyxLQUFLLFVBQVUsTUFBTSwrQkFBK0IsQ0FBQztBQUM1RCwrRUFBK0U7QUFFL0U7OztHQUdHO0FBQ0gsTUFBTSxPQUFnQixNQUFNO0NBSTNCO0FBVUQsTUFBTSxZQUFhLFNBQVEsTUFBcUM7SUFDOUQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFDTSxhQUFhO1FBQ2xCLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQUM7SUFDNUIsQ0FBQztDQUNGO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sTUFBTSxHQUFnRCxHQUFHLEVBQUUsQ0FDdEUsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUVyQixNQUFNLGFBQWMsU0FBUSxNQUFlO0lBQ3pDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDO0lBQzdCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBMEIsR0FBRyxFQUFFLENBQUMsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUV4RSxNQUFNLFVBQVcsU0FBUSxNQUFZO0lBQ25DO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtRQUNsQixPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxDQUFDO0lBQzFCLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILE1BQU0sQ0FBQyxNQUFNLElBQUksR0FBdUIsR0FBRyxFQUFFLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQztBQUUvRCxNQUFNLFlBQWEsU0FBUSxNQUFjO0lBQ3ZDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBQ00sYUFBYTtR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Q0FDSCxDQUFDO0lBQ0osQ0FBQztJQUNNLGFBQWE7UUFDbEIsT0FBTztZQUNMLElBQUksRUFBRSxVQUFVO1lBQ2hCLE9BQU8sRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFO1NBQy9CLENBQUM7SUFDSixDQUFDO0lBQ00sWUFBWSxDQUFDLEtBQVE7UUFDMUIsT0FBTyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBQ00sY0FBYyxDQUFDLEtBQW1CO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBTSxVQUFVLENBQUMsY0FBYyxDQUFJLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzRCx1REFBdUQ7UUFDdkQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDdEMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQ2Isc0JBQXNCLEdBQUcsOEJBQThCLElBQUksQ0FBQyxTQUFTLENBQ25FLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FDWixhQUFhLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FDM0MsQ0FBQzthQUNIO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFDSCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQUVEOzs7R0FHRztBQUNILDhEQUE4RDtBQUM5RCxNQUFNLFVBQVUsTUFBTSxDQUFnQyxJQUVyRDtJQUNDLE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBSSxJQUFJLENBQUMsQ0FBQztBQUMxQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBUeXBlIHNhZmUgc2NoZW1hIGZvciBEeW5hbW9EQi5cbiAqIEBtb2R1bGVcbiAqL1xuXG5pbXBvcnQgdHlwZSB7IEF0dHJpYnV0ZVZhbHVlIH0gZnJvbSBcImF3cy1zZGsvY2xpZW50cy9keW5hbW9kYlwiO1xuaW1wb3J0IHR5cGUgKiBhcyBjbGllbnRzIGZyb20gXCJhd3Mtc2RrL2NsaWVudHMvZHluYW1vZGJcIjtcbmltcG9ydCAqIGFzIG1hcnNoYWxsZXIgZnJvbSBcIkBhd3MvZHluYW1vZGItZGF0YS1tYXJzaGFsbGVyXCI7XG4vLyBpbXBvcnQge3VubWFyc2hhbGxJdGVtLCBtYXJzaGFsbFZhbHVlfSBmcm9tIFwiQGF3cy9keW5hbW9kYi1kYXRhLW1hcnNoYWxsZXJcIjtcblxuLyoqXG4gKiBTY2hlbWFcbiAqIEBncm91cCBDb3JlXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBTY2hlbWE8VD4ge1xuICAvKiogQGhpZGRlbiAqL1xuICByZWFkb25seSBfSV9BTV9GT09MX0VOT1VHSF9UT19BQ0NFU1NfVEhJUyE6IFQ7XG4gIGFic3RyYWN0IHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlO1xufVxuXG4vKipcbiAqIEluZmVyIHR5cGUgb2YgU2NoZW1hLlxuICogQGdyb3VwIENvcmVcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCB0eXBlIGluZmVyPFMgZXh0ZW5kcyBTY2hlbWE8YW55Pj4gPVxuICBTW1wiX0lfQU1fRk9PTF9FTk9VR0hfVE9fQUNDRVNTX1RISVNcIl07XG5cbmNsYXNzIEJpbmFyeVNjaGVtYSBleHRlbmRzIFNjaGVtYTxBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldz4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJCaW5hcnlcIiB9O1xuICB9XG59XG5cbi8qKlxuICogQmluYXJ5IFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJ1ZmZlcjogKCkgPT4gU2NoZW1hPEFycmF5QnVmZmVyVmlldyB8IEFycmF5QnVmZmVyPiA9ICgpID0+XG4gIG5ldyBCaW5hcnlTY2hlbWEoKTtcblxuY2xhc3MgQm9vbGVhblNjaGVtYSBleHRlbmRzIFNjaGVtYTxib29sZWFuPiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4geyB0eXBlOiBcIkJvb2xlYW5cIiB9O1xuICB9XG59XG5cbi8qKlxuICogQm9vbGVhbiBTY2hlbWFcbiAqIEBncm91cCBQcmltaXRpdmUgU2NoZW1hXG4gKi9cbmV4cG9ydCBjb25zdCBib29sZWFuOiAoKSA9PiBTY2hlbWE8Ym9vbGVhbj4gPSAoKSA9PiBuZXcgQm9vbGVhblNjaGVtYSgpO1xuXG5jbGFzcyBEYXRlU2NoZW1hIGV4dGVuZHMgU2NoZW1hPERhdGU+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiRGF0ZVwiIH07XG4gIH1cbn1cblxuLyoqXG4gKiBEYXRlIFNjaGVtYVxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGRhdGU6ICgpID0+IFNjaGVtYTxEYXRlPiA9ICgpID0+IG5ldyBEYXRlU2NoZW1hKCk7XG5cbmNsYXNzIE51bWJlclNjaGVtYSBleHRlbmRzIFNjaGVtYTxudW1iZXI+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiTnVtYmVyXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIE51bWJlciBTY2hlbWEuXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3QgbnVtYmVyOiAoKSA9PiBTY2hlbWE8bnVtYmVyPiA9ICgpID0+IG5ldyBOdW1iZXJTY2hlbWEoKTtcblxuY2xhc3MgQmlnSW50U2NoZW1hIGV4dGVuZHMgU2NoZW1hPEJpZ0ludD4ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiQ3VzdG9tXCIsXG4gICAgICBtYXJzaGFsbChpbnB1dDogQmlnSW50KSB7XG4gICAgICAgIHJldHVybiB7IFwiTlwiOiBpbnB1dC50b1N0cmluZygpIH07XG4gICAgICB9LFxuICAgICAgdW5tYXJzaGFsbChpbnB1dDogQXR0cmlidXRlVmFsdWUpIHtcbiAgICAgICAgaWYgKFwiTlwiIGluIGlucHV0KSB7XG4gICAgICAgICAgcmV0dXJuIEJpZ0ludChpbnB1dC5OKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgYSBOdW1iZXJcIik7XG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBCaWdJbnQgU2NoZW1hLlxuICogQGdyb3VwIFByaW1pdGl2ZSBTY2hlbWFcbiAqL1xuZXhwb3J0IGNvbnN0IGJpZ0ludDogKCkgPT4gU2NoZW1hPEJpZ0ludD4gPSAoKSA9PiBuZXcgQmlnSW50U2NoZW1hKCk7XG5cbmNsYXNzIFN0cmluZ1NjaGVtYSBleHRlbmRzIFNjaGVtYTxzdHJpbmc+IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7IHR5cGU6IFwiU3RyaW5nXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIFN0cmluZyBTY2hlbWEuXG4gKiBAZ3JvdXAgUHJpbWl0aXZlIFNjaGVtYVxuICovXG5leHBvcnQgY29uc3Qgc3RyaW5nOiAoKSA9PiBTY2hlbWE8c3RyaW5nPiA9ICgpID0+IG5ldyBTdHJpbmdTY2hlbWEoKTtcblxuY2xhc3MgQXJyYXlTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VFtdPiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJMaXN0XCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBBcnJheSBTY2hlbWFcbiAqIEBncm91cCBDb21iaW5hdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcnJheTxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8VFtdPiB7XG4gIHJldHVybiBuZXcgQXJyYXlTY2hlbWEoaXRlbSk7XG59XG5cbmNsYXNzIE1hcFNjaGVtYTxUPiBleHRlbmRzIFNjaGVtYTxNYXA8c3RyaW5nLCBUPj4ge1xuICByZWFkb25seSBfc2NoZW1hITogU2NoZW1hPFQ+O1xuICBjb25zdHJ1Y3RvcihzY2hlbWE6IFNjaGVtYTxUPikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fc2NoZW1hID0gc2NoZW1hO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVJdGVtKCk6IG1hcnNoYWxsZXIuU2NoZW1hVHlwZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IFwiTWFwXCIsXG4gICAgICBtZW1iZXJUeXBlOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBNYXAgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFwPFQ+KGl0ZW06IFNjaGVtYTxUPik6IFNjaGVtYTxNYXA8c3RyaW5nLCBUPj4ge1xuICByZXR1cm4gbmV3IE1hcFNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgU2V0U2NoZW1hPFxuICBUIGV4dGVuZHMgQXJyYXlCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcgfCBudW1iZXIgfCBCaWdJbnQgfCBzdHJpbmdcbj4gZXh0ZW5kcyBTY2hlbWE8U2V0PFQ+PiB7XG4gIHJlYWRvbmx5IF9zY2hlbWEhOiBTY2hlbWE8VD47XG4gIGNvbnN0cnVjdG9yKHNjaGVtYTogU2NoZW1hPFQ+KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl9zY2hlbWEgPSBzY2hlbWE7XG4gIH1cblxuICBwcml2YXRlIG1lbWJlclR5cGUoKTogXCJTdHJpbmdcIiB8IFwiTnVtYmVyXCIgfCBcIkJpbmFyeVwiIHtcbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgQmluYXJ5U2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJCaW5hcnlcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3NjaGVtYSBpbnN0YW5jZW9mIE51bWJlclNjaGVtYSkge1xuICAgICAgcmV0dXJuIFwiTnVtYmVyXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLl9zY2hlbWEgaW5zdGFuY2VvZiBCaWdJbnRTY2hlbWEpIHtcbiAgICAgIHJldHVybiBcIk51bWJlclwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc2NoZW1hIGluc3RhbmNlb2YgU3RyaW5nU2NoZW1hKSB7XG4gICAgICByZXR1cm4gXCJTdHJpbmdcIjtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBTZXRcIik7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJTZXRcIixcbiAgICAgIG1lbWJlclR5cGU6IHRoaXMubWVtYmVyVHlwZSgpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBTZXQgU2NoZW1hXG4gKiBAZ3JvdXAgQ29tYmluYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0PFQgZXh0ZW5kcyBBcnJheUJ1ZmZlciB8IEFycmF5QnVmZmVyVmlldyB8IG51bWJlciB8IEJpZ0ludCB8IHN0cmluZz4oXG4gIGl0ZW06IFNjaGVtYTxUPlxuKTogU2NoZW1hPFNldDxUPj4ge1xuICByZXR1cm4gbmV3IFNldFNjaGVtYShpdGVtKTtcbn1cblxuY2xhc3MgTnVsbGFibGVTY2hlbWE8VD4gZXh0ZW5kcyBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmVhZG9ubHkgX3NjaGVtYSE6IFNjaGVtYTxUPjtcbiAgY29uc3RydWN0b3Ioc2NoZW1hOiBTY2hlbWE8VD4pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3NjaGVtYSA9IHNjaGVtYTtcbiAgfVxuXG4gIHByaXZhdGUgbWFyc2hhbGwoaW5wdXQ6IFQgfCBudWxsKTogQXR0cmlidXRlVmFsdWUge1xuICAgIGlmIChpbnB1dCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgTlVMTDogdHJ1ZSxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc2VyaWFsaXplZDogQXR0cmlidXRlVmFsdWUgfCB1bmRlZmluZWQgPSBtYXJzaGFsbGVyLm1hcnNoYWxsVmFsdWUoXG4gICAgICB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpLFxuICAgICAgaW5wdXRcbiAgICApO1xuICAgIGlmIChzZXJpYWxpemVkID09PSB2b2lkIDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBtYXJzaGFsbFZhbHVlXCIpO1xuICAgIH1cbiAgICByZXR1cm4gc2VyaWFsaXplZDtcbiAgfVxuXG4gIHByaXZhdGUgdW5tYXJzaGFsbChpbnB1dDogQXR0cmlidXRlVmFsdWUpOiBUIHwgbnVsbCB7XG4gICAgaWYgKFwiTlVMTFwiIGluIGlucHV0KSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZGVzZXJpYWxpemVkOiB7IGZvbzogVCB9ID0gbWFyc2hhbGxlci51bm1hcnNoYWxsSXRlbShcbiAgICAgIHsgZm9vOiB0aGlzLl9zY2hlbWEuc2VyaWFsaXplSXRlbSgpIH0sXG4gICAgICB7IGZvbzogaW5wdXQgfVxuICAgICk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZC5mb287XG4gIH1cblxuICBwdWJsaWMgc2VyaWFsaXplSXRlbSgpOiBtYXJzaGFsbGVyLlNjaGVtYVR5cGUge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiBcIkN1c3RvbVwiLFxuICAgICAgbWFyc2hhbGw6IHRoaXMubWFyc2hhbGwuYmluZCh0aGlzKSxcbiAgICAgIHVubWFyc2hhbGw6IHRoaXMudW5tYXJzaGFsbC5iaW5kKHRoaXMpLFxuICAgIH07XG4gIH1cbn1cblxuLyoqXG4gKiBOdWxsYWJsZSBTY2hlbWFcbiAqIEBncm91cCBDb21iaW5hdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBudWxsYWJsZTxUPihpdGVtOiBTY2hlbWE8VD4pOiBTY2hlbWE8VCB8IG51bGw+IHtcbiAgcmV0dXJuIG5ldyBOdWxsYWJsZVNjaGVtYShpdGVtKTtcbn1cblxuLyoqIEBncm91cCBIZWxwZXJcbiAqL1xuZXhwb3J0IHR5cGUgQXR0cmlidXRlTWFwID0gY2xpZW50cy5BdHRyaWJ1dGVNYXA7XG5cbi8qKiBUeXBlIGZvciBgeyAuLi50LCAuLi52IH1gXG4gKiBAZ3JvdXAgSGVscGVyXG4gKi9cbmV4cG9ydCB0eXBlIE1lcmdlZDxcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgVCBleHRlbmRzIFJlY29yZDxhbnksIGFueT4sXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIFYgZXh0ZW5kcyBSZXF1aXJlZDxSZWNvcmQ8YW55LCBhbnk+PlxuPiA9XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHsgW0sgaW4ga2V5b2YgVF06IEsgZXh0ZW5kcyBrZXlvZiBWID8gYW55IDogVFtLXSB9ICYgVjtcblxuLyoqXG4gKiBPYmplY3QgU2NoZW1hXG4gKiBAZ3JvdXAgQ29yZVxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuZXhwb3J0IGNsYXNzIE9iamVjdFNjaGVtYTxUIGV4dGVuZHMgUmVjb3JkPHN0cmluZywgYW55Pj4gZXh0ZW5kcyBTY2hlbWE8VD4ge1xuICAvKiogUmV0dXJucyBzaGFwZSBvZiB0aGUgU2NoZW1hLlxuICAgKi9cbiAgcHVibGljIHJlYWRvbmx5IHNoYXBlITogeyBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+IH07XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHByaXZhdGUgY29uc3RydWN0b3Ioc2NoZW1hOiB7IFtLIGluIGtleW9mIFRdOiBTY2hlbWE8VFtLXT4gfSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5zaGFwZSA9IHNjaGVtYTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgZnJvbVJlY29yZDxUPihzY2hlbWE6IHtcbiAgICBbSyBpbiBrZXlvZiBUXTogU2NoZW1hPFRbS10+O1xuICB9KTogT2JqZWN0U2NoZW1hPHsgW0sgaW4ga2V5b2YgVF06IFRbS10gfT4ge1xuICAgIHJldHVybiBuZXcgT2JqZWN0U2NoZW1hKHNjaGVtYSk7XG4gIH1cblxuICAvKiogQXNpZ24gcmVxdWlyZWQgZmllbGQuXG4gICAqXG4gICAqIE5vdGUgdGhhdCBgU2NoZW1hYCBjYW5ub3QgaGFuZGxlIG9iamVjdHMgd2l0aCBhbnkgb3B0aW9uYWwgZmllbGRzLlxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0c1xuICAgKiBPYmplY3RTY2hlbWEub2JqZWN0KClcbiAgICogICAuZXh0ZW5kRmllbGQ8eyBmb286IHN0cmluZyB9PihcImZvb1wiLCBzdHJpbmcoKSlcbiAgICogICAuZXh0ZW5kRmllbGQ8eyByZWFkb25seSBiYXI6IG51bWJlciB9PihcImJhclwiLCBudW1iZXIoKSlcbiAgICogLy8gPT4gUmV0dXJucyBTY2hlbWEgZm9yIGB7IGZvbzogc3RyaW5nOyByZWFkb25seSBiYXI6IG51bWJlciB9YFxuICAgKiBgYGBcbiAgICovXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gIHB1YmxpYyBleHRlbmRGaWVsZDxLIGV4dGVuZHMgc3RyaW5nLCBWPihcbiAgICBuYW1lOiBLLFxuICAgIHNjaGVtYTogU2NoZW1hPFY+XG4gICk6IE9iamVjdFNjaGVtYTxNZXJnZWQ8VCwgeyBba2V5IGluIEtdOiBWIH0+PiB7XG4gICAgcmV0dXJuIG5ldyBPYmplY3RTY2hlbWE8TWVyZ2VkPFQsIHsgW2tleSBpbiBLXTogViB9Pj4oe1xuICAgICAgLi4udGhpcy5zaGFwZSxcbiAgICAgIFtuYW1lXTogc2NoZW1hLFxuICAgIH0pO1xuICB9XG4gIHB1YmxpYyBzZXJpYWxpemVWYWx1ZSgpOiBtYXJzaGFsbGVyLlNjaGVtYSB7XG4gICAgcmV0dXJuIE9iamVjdC5mcm9tRW50cmllcyhcbiAgICAgIE9iamVjdC5lbnRyaWVzKHRoaXMuc2hhcGUpLm1hcCgoW2tleSwgc2NoZW1hXSkgPT4gW1xuICAgICAgICBrZXksXG4gICAgICAgIHNjaGVtYS5zZXJpYWxpemVJdGVtKCksXG4gICAgICBdKVxuICAgICk7XG4gIH1cbiAgcHVibGljIHNlcmlhbGl6ZUl0ZW0oKTogbWFyc2hhbGxlci5TY2hlbWFUeXBlIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogXCJEb2N1bWVudFwiLFxuICAgICAgbWVtYmVyczogdGhpcy5zZXJpYWxpemVWYWx1ZSgpLFxuICAgIH07XG4gIH1cbiAgcHVibGljIG1hcnNoYWxsSXRlbShpbnB1dDogVCk6IEF0dHJpYnV0ZU1hcCB7XG4gICAgcmV0dXJuIG1hcnNoYWxsZXIubWFyc2hhbGxJdGVtKHRoaXMuc2VyaWFsaXplVmFsdWUoKSwgaW5wdXQpO1xuICB9XG4gIHB1YmxpYyB1bm1hcnNoYWxsSXRlbShpbnB1dDogQXR0cmlidXRlTWFwKTogVCB7XG4gICAgY29uc3Qgc2NoZW1hID0gdGhpcy5zZXJpYWxpemVWYWx1ZSgpO1xuICAgIGNvbnN0IHJldDogVCA9IG1hcnNoYWxsZXIudW5tYXJzaGFsbEl0ZW08VD4oc2NoZW1hLCBpbnB1dCk7XG4gICAgLy8gSXQgc2VlbXMgdGhhdCBtYXJzaGFsbGVyLnVubWFyc2hhbGxJdGVtIGhhcyBhIGJ1Zy4uLlxuICAgIE9iamVjdC5rZXlzKHRoaXMuc2hhcGUpLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgaWYgKHJldFtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBWYWx1ZSBmb3IgcHJvcGVydHkgJHtrZXl9IGlzIHVuZXhwZWN0ZWQuXFxuRXhwZWN0ZWQ6ICR7SlNPTi5zdHJpbmdpZnkoXG4gICAgICAgICAgICBzY2hlbWFba2V5XVxuICAgICAgICAgICl9XFxuQWN0dWFsOiAke0pTT04uc3RyaW5naWZ5KGlucHV0W2tleV0pfWBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG59XG5cbi8qKlxuICogT2JqZWN0IFNjaGVtYVxuICogQGdyb3VwIENvbWJpbmF0b3JcbiAqL1xuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBmdW5jdGlvbiBvYmplY3Q8VCBleHRlbmRzIFJlY29yZDxzdHJpbmcsIGFueT4+KGl0ZW06IHtcbiAgW0sgaW4ga2V5b2YgVF06IFNjaGVtYTxUW0tdPjtcbn0pOiBPYmplY3RTY2hlbWE8VD4ge1xuICByZXR1cm4gT2JqZWN0U2NoZW1hLmZyb21SZWNvcmQ8VD4oaXRlbSk7XG59XG4iXX0=