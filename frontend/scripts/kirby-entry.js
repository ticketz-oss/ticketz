import { createAvatar } from "@bible-strong/avatar-web";
import definition from "../public/agent-preview/kirby.avatar.json";

export const KIRBY_ANIMATIONS = Object.freeze(
  Object.keys(definition.animations)
);

export function mountKirby(target, animation = "idle") {
  target.dataset.animation = animation;
  return createAvatar(target, {
    definition,
    defaultAnimation: animation,
    autoplay: true,
    size: "100%",
    ariaLabel: "Kirby, personagem animado do Agente Espaço"
  });
}

export function isKirbyAnimation(animation) {
  return Object.prototype.hasOwnProperty.call(definition.animations, animation);
}

export function kirbyExpression(animation) {
  return definition.animations[animation]?.steps[0]?.expression || "neutral";
}
