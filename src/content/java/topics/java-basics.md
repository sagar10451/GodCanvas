# Java Basics

This section covers the fundamental building blocks of Java programming including syntax rules, naming conventions, and the basic structure of a Java program.

## Program Structure

Every Java program follows this basic structure:

```java
package com.example; // Package declaration (optional)

import java.util.Scanner; // Import statements

public class MyProgram { // Class declaration

    // Main method - entry point
    public static void main(String[] args) {
        System.out.println("Hello Java!");
    }
}
```

## Data Types

Java has two categories of data types:

### Primitive Types

| Type | Size | Default | Range |
|------|------|---------|-------|
| byte | 1 byte | 0 | -128 to 127 |
| short | 2 bytes | 0 | -32,768 to 32,767 |
| int | 4 bytes | 0 | -2^31 to 2^31-1 |
| long | 8 bytes | 0L | -2^63 to 2^63-1 |
| float | 4 bytes | 0.0f | ~7 decimal digits |
| double | 8 bytes | 0.0d | ~15 decimal digits |
| char | 2 bytes | '\u0000' | 0 to 65,535 |
| boolean | 1 bit | false | true or false |

### Reference Types
- Strings
- Arrays
- Objects
- Interfaces

## Variables

```java
// Declaration
int age;

// Initialization
age = 25;

// Declaration + Initialization
String name = "Sagar";

// Constants
final double PI = 3.14159;
```

## Operators

### Arithmetic Operators
```java
int a = 10, b = 3;
System.out.println(a + b);  // 13
System.out.println(a - b);  // 7
System.out.println(a * b);  // 30
System.out.println(a / b);  // 3
System.out.println(a % b);  // 1
```

### Comparison Operators
```java
System.out.println(a == b);  // false
System.out.println(a != b);  // true
System.out.println(a > b);   // true
System.out.println(a < b);   // false
```

## Key Takeaways

- Java is statically typed — declare variable types explicitly
- Primitive types store values; reference types store addresses
- Use `final` for constants
- Java is case-sensitive
