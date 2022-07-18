# Type-safe Schema for Amazon DynamoDB

[@aws/dynamodb-data-marshaller](https://awslabs.github.io/dynamodb-data-mapper-js/packages/dynamodb-data-marshaller/index.html) is a great library that enables to convert native JavaScript values to DynamoDB AttributeValues and back again, respectively, based on a defined schema.

```typescript
import * as marshaller from "@aws/dynamodb-data-marshaller";

// First, define schema for DynamoDB.
const schema = {
  foo: { type: "Number" },
};

// You can convert DynamoDB AttributeValues to JavaScript value.
marshaller.marshallItem(schema, {foo: 3});
// => { foo: { N: '3' } }
```

While the schema allows you to losslessly persist any JavaScript type, it does not take advantage of the benefits of static types by TypeScript at all:

```typescript
marshaller.marshallItem(schema, {foo: "foo"});
// => { foo: { N: 'foo' } }

marshaller.marshallItem(schema, {foo: 4, bar: "foo"});
// => { foo: { N: '4' } }
```

By using ts-dynamodb-schema, you can achieve a more type-safe conversion:

```typescript
import {ObjectSchema, number, string} from "ts-dynamodb-schema";
import type * as tds from "ts-dynamodb-schema";
import type { AttributeMap } from "aws-sdk/clients/dynamodb";

const schema =
  ObjectSchema.empty()
    .field<{ readonly foo: number }>("foo", number())
    .field<{ bar: string }>("bar", string());

type Foo = tds.infer<typeof schema>;
// => { readonly foo: number, bar: string }

const serialized : AttributeMap = schema.marshallItem({ foo: 3, bar: "foo" });
// => { foo: { N: '3' }, bar: { S: 'foo' } }

// schema.marshallItem({ foo: "3", bar: "foo" });
// => Compile Error!

const deserialized : Foo = schema.unmarshallItem({ foo: { N: "3" }, bar: { S: "foo" }});
// => { foo: 3, bar: 'foo' }
```
