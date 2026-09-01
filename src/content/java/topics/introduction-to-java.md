# Introduction to Java

Java is a high-level, class-based, object-oriented programming language that is designed to have as few implementation dependencies as possible. It was developed by **James Gosling** at Sun Microsystems and released in **1995**.

## Why Java?

- **Platform Independent** — Write Once, Run Anywhere (WORA)
- **Object-Oriented** — Everything is an object
- **Robust** — Strong memory management, exception handling
- **Secure** — No explicit pointers, bytecode verification
- **Multithreaded** — Built-in support for concurrent programming
- **High Performance** — JIT compiler optimizes bytecode

## Java Architecture

### JDK (Java Development Kit)
The JDK is the full development kit that includes:
- JRE (Java Runtime Environment)
- Development tools (compiler, debugger)
- Documentation

### JRE (Java Runtime Environment)
The JRE provides:
- JVM (Java Virtual Machine)
- Core libraries
- Runtime environment to execute Java programs

### JVM (Java Virtual Machine)
The JVM is responsible for:
- Loading bytecode
- Verifying bytecode
- Executing bytecode
- Providing runtime environment

```
Source Code (.java)
       ↓ compile (javac)
Bytecode (.class)
       ↓ execute
JVM → Machine Code
```

## Your First Java Program

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### Breaking it down:
- `public class HelloWorld` — class declaration
- `public static void main(String[] args)` — entry point
- `System.out.println()` — prints to console

## How to Run

```bash
# Compile
javac HelloWorld.java

# Run
java HelloWorld
```

> **Note:** The filename must match the public class name.

## Key Takeaways

- Java is platform-independent thanks to the JVM
- JDK > JRE > JVM (superset relationship)
- Every Java program needs a `main` method as entry point
- Java source code is compiled to bytecode, not native code
