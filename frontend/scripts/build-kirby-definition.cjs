// Converts the user's original Avatar Lab export to the current official v1
// definition. Geometry, expression poses and animation timings stay intact.
const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  "../public/agent-preview/kirby-library/kirby.avatar.ts"
);
const output = path.join(
  __dirname,
  "../public/agent-preview/kirby.avatar.json"
);
const text = fs.readFileSync(source, "utf8");
const match = text.match(
  /export const avatarData = (\{.*\}) as const satisfies AvatarData/s
);
if (!match) throw new Error("Kirby export not found");
const original = JSON.parse(match[1]);

const expressions = Object.fromEntries(
  Object.entries(original.expressions).map(([key, expression]) => [
    key,
    {
      head: {
        x: expression.headX,
        y: expression.headY,
        z: expression.headZ
      },
      eyes: {
        left: {
          width: expression.widthLeft,
          height: expression.heightLeft,
          x: expression.positionXLeft,
          y: expression.positionYLeft,
          angle: expression.leftAngle
        },
        right: {
          width: expression.widthRight,
          height: expression.heightRight,
          x: expression.positionXRight,
          y: expression.positionYRight,
          angle: expression.rightAngle
        },
        spacing: expression.spacing
      },
      perspective: expression.perspective,
      motion: {
        eyes: expression.eyeMotion,
        body: expression.bodyMotion
      }
    }
  ])
);
// The v1 format requires a neutral pose. Reference Kirby's original 00 pose.
expressions.neutral = expressions["expression-00"];

const animations = Object.fromEntries(
  Object.entries(original.animations).map(([key, animation]) => [
    key,
    {
      playbackMode: animation.playbackMode,
      steps: animation.steps.map(step => ({
        expression: step.expressionId,
        holdMs: step.holdMs,
        transitionMs: step.transitionMs,
        transition: step.transition
      })),
      blink: animation.blink,
      metadata: {
        label: animation.name,
        description: animation.description
      }
    }
  ])
);

// State-specific copies keep shared poses (for example working/angry) independent.
// Expression colors are part of the official Avatar Lab definition schema.
const emotionColors = {
  angry: { body: "#e74742", eyes: "#651c29" },
  sad: { body: "#b7d9ff", eyes: "#405b7c" }
};
const emotionExpressions = [];
for (const [animation, colors] of Object.entries(emotionColors)) {
  for (const step of animations[animation].steps) {
    const key = `${animation}-${step.expression}`;
    if (!expressions[key]) {
      expressions[key] = { ...expressions[step.expression], colors };
      emotionExpressions.push(key);
    }
    step.expression = key;
  }
}

const definition = {
  schema: "bible-strong/avatar-definition",
  schemaVersion: 1,
  name: "Kirby",
  body: {
    primary: original.avatar.surface,
    nodes: original.avatar.bodyNodes.map(node => ({
      surface: node.surface,
      position: node.position,
      rotation: node.rotation
    }))
  },
  colors: { ...original.avatar.colors, body: "#ff7728" },
  expressions,
  expressionOrder: [
    "neutral",
    ...Object.keys(original.expressions),
    ...emotionExpressions
  ],
  animations,
  animationOrder: Object.keys(original.animations)
};

fs.writeFileSync(output, `${JSON.stringify(definition)}\n`);
console.log(
  `Kirby definition ready: ${definition.expressionOrder.length} expressions, ${definition.animationOrder.length} animations.`
);
