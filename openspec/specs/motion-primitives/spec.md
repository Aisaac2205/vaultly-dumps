# Spec: motion-primitives

## Purpose

Reusable motion components built on `motion/react` with `useReducedMotion()` support. Provides entrance animations (FadeIn), list reveals (Stagger), and press feedback (PressFeedback) while animating only GPU-accelerated properties (`transform` and `opacity`).

## Requirements

### Requirement: FadeIn Component

The system MUST provide a `<FadeIn>` component for entrance animations.

- Default duration: `220ms`.
- Default easing: `var(--ease-out-expo)`.
- Animate `opacity` from `0` to `1` and `translateY` from `8px` to `0`.
- When `useReducedMotion()` returns `true`, the animation degrades to instant (opacity-only or no animation).

#### Scenario: Normal entrance
- **WHEN** a `<FadeIn>` element mounts
- **THEN** it animates opacity and translateY over 220ms with ease-out-expo

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** the element appears instantly without translateY animation

#### Scenario: Interrupt mid-animation
- **WHEN** a `<FadeIn>` element unmounts or its key changes before the animation completes
- **THEN** the animation is interrupted cleanly without throwing errors

### Requirement: Stagger Component

The system MUST provide a `<Stagger>` component for list reveals.

- Stagger delay between items: `50ms`.
- Compose children inside `motion.div` with `variants`.
- Each child item animates the same `opacity` and `translateY` as `<FadeIn>`.
- When `useReducedMotion()` returns `true`, the animation degrades to instant.

#### Scenario: List reveal
- **WHEN** a list of 5 items is rendered inside `<Stagger>`
- **THEN** items appear sequentially with 50ms stagger, each fading in and sliding up

#### Scenario: Stagger order preserved
- **WHEN** the list order changes mid-animation
- **THEN** the visual order remains correct and the animation completes without visual tearing

#### Scenario: Reduced motion stagger
- **WHEN** the user prefers reduced motion
- **THEN** all items appear instantly without stagger delay

### Requirement: PressFeedback Component

The system MUST provide a `<PressFeedback>` component for pressable elements.

- On `:active` (or `whileTap`), the element scales to `0.97`.
- Transition duration: `160ms` with `var(--ease-out-strong)`.
- When `useReducedMotion()` returns `true`, the transition is instant (no scale animation).

#### Scenario: Press feedback active
- **WHEN** the user presses a `<PressFeedback>` element
- **THEN** it scales to `0.97` with 160ms ease-out-strong transition

#### Scenario: Reduced motion press
- **WHEN** the user prefers reduced motion and presses a `<PressFeedback>` element
- **THEN** the scale change is instant (no animation)

### Requirement: GPU-Accelerated Properties Only

All motion components MUST animate ONLY `transform` and `opacity`.

- **NEVER** animate layout-triggering properties (e.g., `width`, `height`, `top`, `left`, `margin`).
- **NEVER** use `motion.x` or `motion.y` props (which are not hardware-accelerated under load).
- Use `motion.div` with explicit `transform` and `opacity` style changes.

#### Scenario: GPU-only animation
- **WHEN** inspecting the motion component styles during animation
- **THEN** only `transform` and `opacity` are observed changing

#### Scenario: No layout thrashing
- **WHEN** a `<Stagger>` with 50 items animates simultaneously
- **THEN** no layout thrashing occurs (no width/height/margin changes)
