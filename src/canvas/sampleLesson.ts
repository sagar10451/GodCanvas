import { createShapeId, toRichText } from 'tldraw';
import type { Editor } from 'tldraw';
import type { AnimationStep } from './types';

/**
 * Creates a sample OOP lesson on the canvas.
 * Called once when the OOP Concepts lesson has no saved data.
 */
export function createSampleOOPLesson(editor: Editor): AnimationStep[] {
  // Don't seed if canvas already has content
  if (editor.getCurrentPageShapeIds().size > 0) return [];

  // Shape IDs
  const titleId = createShapeId('title');
  const subtitleId = createShapeId('subtitle');
  const carBoxId = createShapeId('car-box');
  const propsBoxId = createShapeId('props-box');
  const methodsBoxId = createShapeId('methods-box');
  const propsLabel1 = createShapeId('props-l1');
  const methodsLabel1 = createShapeId('methods-l1');
  const pillarsTitle = createShapeId('pillars-title');
  const encapBox = createShapeId('encap-box');
  const inheritBox = createShapeId('inherit-box');
  const polyBox = createShapeId('poly-box');
  const abstractBox = createShapeId('abstract-box');

  editor.createShapes([
    // Title
    {
      id: titleId,
      type: 'text',
      x: 200,
      y: 80,
      props: {
        richText: toRichText('Object Oriented Programming'),
        size: 'xl',
        color: 'blue',
      },
    },
    // Subtitle
    {
      id: subtitleId,
      type: 'text',
      x: 200,
      y: 140,
      props: {
        richText: toRichText('A programming paradigm based on objects'),
        size: 'm',
        color: 'grey',
      },
    },
    // Car class box
    {
      id: carBoxId,
      type: 'geo',
      x: 320,
      y: 220,
      props: {
        w: 200,
        h: 80,
        geo: 'rectangle',
        color: 'blue',
        fill: 'solid',
        richText: toRichText('Car'),
      },
    },
    // Properties box
    {
      id: propsBoxId,
      type: 'geo',
      x: 140,
      y: 380,
      props: {
        w: 180,
        h: 60,
        geo: 'rectangle',
        color: 'green',
        fill: 'semi',
        richText: toRichText('Properties'),
      },
    },
    // Methods box
    {
      id: methodsBoxId,
      type: 'geo',
      x: 520,
      y: 380,
      props: {
        w: 180,
        h: 60,
        geo: 'rectangle',
        color: 'violet',
        fill: 'semi',
        richText: toRichText('Methods'),
      },
    },
    // Property labels
    {
      id: propsLabel1,
      type: 'text',
      x: 160,
      y: 460,
      props: {
        richText: toRichText('• color\n• speed\n• brand'),
        size: 's',
        color: 'green',
      },
    },
    // Method labels
    {
      id: methodsLabel1,
      type: 'text',
      x: 540,
      y: 460,
      props: {
        richText: toRichText('• drive()\n• brake()\n• accelerate()'),
        size: 's',
        color: 'violet',
      },
    },
    // Four pillars title
    {
      id: pillarsTitle,
      type: 'text',
      x: 200,
      y: 600,
      props: {
        richText: toRichText('Four Pillars of OOP'),
        size: 'l',
        color: 'black',
      },
    },
    // Encapsulation
    {
      id: encapBox,
      type: 'geo',
      x: 100,
      y: 680,
      props: {
        w: 160,
        h: 50,
        geo: 'rectangle',
        color: 'blue',
        fill: 'solid',
        richText: toRichText('Encapsulation'),
      },
    },
    // Inheritance
    {
      id: inheritBox,
      type: 'geo',
      x: 290,
      y: 680,
      props: {
        w: 160,
        h: 50,
        geo: 'rectangle',
        color: 'green',
        fill: 'solid',
        richText: toRichText('Inheritance'),
      },
    },
    // Polymorphism
    {
      id: polyBox,
      type: 'geo',
      x: 480,
      y: 680,
      props: {
        w: 160,
        h: 50,
        geo: 'rectangle',
        color: 'violet',
        fill: 'solid',
        richText: toRichText('Polymorphism'),
      },
    },
    // Abstraction
    {
      id: abstractBox,
      type: 'geo',
      x: 670,
      y: 680,
      props: {
        w: 160,
        h: 50,
        geo: 'rectangle',
        color: 'red',
        fill: 'solid',
        richText: toRichText('Abstraction'),
      },
    },
  ]);

  // Create animation steps
  const animationSteps: AnimationStep[] = [
    {
      id: 'step-1',
      shapeIds: [titleId as string, subtitleId as string],
      animation: 'fadeIn',
      duration: 800,
      label: 'Title appears',
    },
    {
      id: 'step-2',
      shapeIds: [carBoxId as string],
      animation: 'zoomIn',
      duration: 600,
      label: 'Car class appears',
    },
    {
      id: 'step-3',
      shapeIds: [propsBoxId as string, propsLabel1 as string],
      animation: 'flyInLeft',
      duration: 700,
      label: 'Properties appear',
    },
    {
      id: 'step-4',
      shapeIds: [methodsBoxId as string, methodsLabel1 as string],
      animation: 'flyInRight',
      duration: 700,
      label: 'Methods appear',
    },
    {
      id: 'step-5',
      shapeIds: [pillarsTitle as string],
      animation: 'fadeIn',
      duration: 800,
      label: 'Pillars title',
    },
    {
      id: 'step-6',
      shapeIds: [encapBox as string],
      animation: 'pop',
      duration: 500,
      label: 'Encapsulation',
    },
    {
      id: 'step-7',
      shapeIds: [inheritBox as string],
      animation: 'pop',
      duration: 500,
      label: 'Inheritance',
    },
    {
      id: 'step-8',
      shapeIds: [polyBox as string],
      animation: 'pop',
      duration: 500,
      label: 'Polymorphism',
    },
    {
      id: 'step-9',
      shapeIds: [abstractBox as string],
      animation: 'pop',
      duration: 500,
      label: 'Abstraction',
    },
  ];

  return animationSteps;
}
