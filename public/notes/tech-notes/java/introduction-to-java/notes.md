# Introduction to Java

## What is Java?

Java is a high-level, class-based, object-oriented programming language designed to have as few implementation dependencies as possible. It was developed by James Gosling at Sun Microsystems and released in 1995.

Java follows the principle of **WORA** — Write Once, Run Anywhere. Code compiled on one platform can run on any platform that has a JVM (Java Virtual Machine).

## Key Features

- **Platform Independent** — Java bytecode runs on any OS via the JVM
- **Object-Oriented** — Everything in Java is an object (except primitives)
- **Strongly Typed** — Variables must be declared with a type
- **Automatic Memory Management** — Garbage collector handles memory cleanup
- **Multithreaded** — Built-in support for concurrent programming
- **Secure** — No explicit pointers, bytecode verification, sandboxed execution
- **Rich Standard Library** — Extensive built-in APIs for I/O, networking, collections, etc.

## Java Architecture

```
Source Code (.java)
       |
   [javac compiler]
       |
Bytecode (.class)
       |
   [JVM - Java Virtual Machine]
       |
   Machine Code (OS-specific)
```

### JDK vs JRE vs JVM

| Component | What it is | Contains |
|-----------|-----------|----------|
| **JVM** | Runtime engine that executes bytecode | Interpreter, JIT compiler, garbage collector |
| **JRE** | Runtime environment | JVM + core libraries |
| **JDK** | Development kit | JRE + compiler (javac) + tools (jdb, javadoc) |

## Hello World

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### Breaking it down:

- `public class HelloWorld` — class name must match filename
- `public static void main(String[] args)` — entry point of every Java program
- `System.out.println()` — prints to console with a newline

## Compilation & Execution

```bash
# Compile
javac HelloWorld.java

# Run
java HelloWorld
```

## Java Editions

| Edition | Purpose |
|---------|---------|
| **Java SE** (Standard Edition) | Core language, desktop apps |
| **Java EE** (Enterprise Edition) | Web apps, microservices, enterprise systems |
| **Java ME** (Micro Edition) | Mobile and embedded devices |

## Why Java is Popular

1. **Enterprise dominance** — Powers most banking, insurance, and healthcare systems
2. **Android development** — Primary language for Android apps (alongside Kotlin)
3. **Massive ecosystem** — Spring, Hibernate, Maven, Gradle, and thousands of libraries
4. **Backward compatibility** — Code written 20 years ago still compiles
5. **Performance** — JIT compilation makes it nearly as fast as C++ for many workloads
6. **Community** — One of the largest developer communities worldwide

## Java Versions Timeline

- **Java 8 (2014)** — Lambdas, Streams, Optional, new Date/Time API
- **Java 11 (2018)** — First LTS after new release cadence, HTTP client, var in lambdas
- **Java 17 (2021)** — Sealed classes, pattern matching, records
- **Java 21 (2023)** — Virtual threads (Project Loom), pattern matching for switch

> Modern Java releases every 6 months, with LTS versions every 2 years.
