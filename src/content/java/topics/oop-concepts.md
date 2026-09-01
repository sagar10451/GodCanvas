# OOP Concepts in Java

Object-Oriented Programming (OOP) is a programming paradigm that organizes software design around **objects** rather than functions and logic. Java is a purely object-oriented language (except for primitive types), and understanding OOP is fundamental to writing clean, maintainable Java code.

## What is OOP?

OOP is based on the concept of "objects" which contain:
- **Data** (in the form of fields, often called attributes or properties)
- **Code** (in the form of methods)

The four main principles of OOP are:
1. **Encapsulation**
2. **Inheritance**
3. **Polymorphism**
4. **Abstraction**

---

## Class and Object

### Class
A **class** is a blueprint or template for creating objects. It defines properties and behaviors that objects of that type will have.

```java
public class Car {
    // Properties (fields)
    String brand;
    String color;
    int speed;

    // Behavior (method)
    public void accelerate() {
        speed += 10;
        System.out.println(brand + " is now going " + speed + " km/h");
    }

    public void brake() {
        speed -= 10;
        System.out.println(brand + " slowed down to " + speed + " km/h");
    }
}
```

### Object
An **object** is an instance of a class. It is a real-world entity created from the class blueprint.

```java
public class Main {
    public static void main(String[] args) {
        // Creating objects
        Car myCar = new Car();
        myCar.brand = "Toyota";
        myCar.color = "Red";
        myCar.speed = 0;

        myCar.accelerate(); // Toyota is now going 10 km/h
        myCar.accelerate(); // Toyota is now going 20 km/h
        myCar.brake();      // Toyota slowed down to 10 km/h
    }
}
```

---

## Encapsulation

Encapsulation is the mechanism of **wrapping data (variables) and methods together** as a single unit. It restricts direct access to some of an object's components, which is called data hiding.

### Key Points:
- Declare class variables as `private`
- Provide public `getter` and `setter` methods to access and update the value

```java
public class BankAccount {
    private double balance; // private = restricted access

    // Getter
    public double getBalance() {
        return balance;
    }

    // Setter with validation
    public void deposit(double amount) {
        if (amount > 0) {
            balance += amount;
        } else {
            System.out.println("Invalid deposit amount");
        }
    }

    public void withdraw(double amount) {
        if (amount > 0 && amount <= balance) {
            balance -= amount;
        } else {
            System.out.println("Invalid withdrawal");
        }
    }
}
```

> **Why Encapsulation?**  
> It provides control over the data. You can validate inputs, make fields read-only, and change internal implementation without affecting external code.

---

## Inheritance

Inheritance is the mechanism by which **one class acquires the properties and behaviors of another class**. It represents an IS-A relationship.

### Key Points:
- Use the `extends` keyword
- The class that inherits is called the **subclass** (child class)
- The class being inherited from is called the **superclass** (parent class)
- Java supports single inheritance (one parent class)

```java
// Parent class
public class Animal {
    String name;

    public void eat() {
        System.out.println(name + " is eating");
    }

    public void sleep() {
        System.out.println(name + " is sleeping");
    }
}

// Child class
public class Dog extends Animal {
    public void bark() {
        System.out.println(name + " is barking");
    }
}

// Usage
public class Main {
    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.name = "Buddy";
        dog.eat();   // Inherited from Animal
        dog.sleep(); // Inherited from Animal
        dog.bark();  // Defined in Dog
    }
}
```

### Types of Inheritance in Java:
| Type | Description |
|------|-------------|
| Single | One child inherits from one parent |
| Multilevel | A → B → C (chain) |
| Hierarchical | Multiple children inherit from one parent |

> **Note:** Java does NOT support multiple inheritance with classes (use interfaces instead).

---

## Polymorphism

Polymorphism means **"many forms"**. It allows one interface to be used for different data types. In Java, polymorphism is mainly achieved in two ways:

### 1. Compile-time Polymorphism (Method Overloading)

Same method name, different parameters:

```java
public class Calculator {
    public int add(int a, int b) {
        return a + b;
    }

    public double add(double a, double b) {
        return a + b;
    }

    public int add(int a, int b, int c) {
        return a + b + c;
    }
}
```

### 2. Runtime Polymorphism (Method Overriding)

Child class provides a specific implementation of a method already defined in the parent class:

```java
public class Shape {
    public void draw() {
        System.out.println("Drawing a shape");
    }
}

public class Circle extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a circle");
    }
}

public class Rectangle extends Shape {
    @Override
    public void draw() {
        System.out.println("Drawing a rectangle");
    }
}

// Runtime polymorphism in action
public class Main {
    public static void main(String[] args) {
        Shape shape1 = new Circle();
        Shape shape2 = new Rectangle();

        shape1.draw(); // Drawing a circle
        shape2.draw(); // Drawing a rectangle
    }
}
```

---

## Abstraction

Abstraction is the process of **hiding implementation details** and showing only the essential features of an object. It is achieved using:

1. **Abstract classes** (0-100% abstraction)
2. **Interfaces** (100% abstraction)

### Abstract Class Example:

```java
public abstract class Vehicle {
    abstract void start(); // Abstract method - no body
    abstract void stop();

    // Concrete method
    public void fuel() {
        System.out.println("Vehicle needs fuel");
    }
}

public class Car extends Vehicle {
    @Override
    void start() {
        System.out.println("Car starts with key ignition");
    }

    @Override
    void stop() {
        System.out.println("Car stops with brake pedal");
    }
}
```

### Interface Example:

```java
public interface Flyable {
    void fly();          // abstract by default
    void land();

    default void showStatus() {
        System.out.println("Flying status: active");
    }
}

public class Airplane implements Flyable {
    @Override
    public void fly() {
        System.out.println("Airplane flying at 30,000 feet");
    }

    @Override
    public void land() {
        System.out.println("Airplane landing on runway");
    }
}
```

---

## Summary Table

| Concept | Key Idea | Keyword |
|---------|----------|---------|
| Encapsulation | Data hiding + bundling | `private`, getters/setters |
| Inheritance | Code reuse, IS-A relationship | `extends` |
| Polymorphism | One name, many forms | `@Override`, overloading |
| Abstraction | Hide complexity, show essentials | `abstract`, `interface` |

---

## Key Takeaways

- OOP helps in building **modular, reusable, and maintainable** code
- Java enforces OOP principles — everything lives inside a class
- Master these four pillars and you will write significantly better Java code
- Real-world applications use all four principles together

> **Practice Tip:** Try building a small project like a Library Management System or Banking Application using all four OOP concepts to solidify your understanding.
