# Base Sim

> This copy runs on **GodotJS + Bun** (TypeScript bundled by Bun, run by GodotJS inside Godot) instead of being converted to GDScript. See [docs/GODOTJS-PORT.md](docs/GODOTJS-PORT.md). The text below is the original design write-up.

## Contents

- [Main idea](#main-idea)
- [Gameplay](#gameplay)
  - [How it looks](#how-it-looks)
  - [Roster](#roster)
  - [Assets](#assets)
  - [Profile cards](#profile-cards)
  - [View](#view)
- [Domain vocabulary](#domain-vocabulary)
- [The people](#the-people)
  - [Stats](#stats)
  - [Hunger](#hunger)
  - [Discipline](#discipline)
  - [Fatigue](#fatigue)
  - [Resentments](#resentments)
  - [Connections](#connections)
- [Events](#events)
  - [Internal](#internal)
  - [External](#external)

## Main idea

You are responsible for a base sitting at the border between your country and your enemy’s. Your main job is to stop people from the other side from crossing into yours—but that is only part of the work. Managing the people—from food to motivation—is what a good leader does, and it is what will ultimately determine whether you succeed or fail at your job, and whether your country succeeds or fails.


## Mechanics
The capabilities of the player in the game

## Gameplay

each second maps to an hour in-game, the clock keep ticking.
at certain points of the day there will be a pause, and the player will be asked to make a choice.


## Dynamic
What happens to the player as part of the game, the world acting on it's own - 
* Soldier falling ill
* An enemy attacking at dawn


### How it looks

#### First person

You walk around the base, talk to people, and personally interact with the facilities and missions you need to staff.

### Roster

A collection of units, each with a profile card. Profile cards are the main way to interact with the roster.

### Assets

### Profile cards

Stats, Hunger, Discipline, Fatigue, Morale, Relationships.

### View

#### Top down

Top down, the main scene is the buildings, sections, events, roster, scoring, unit stats, and decisions. There is a map of the base, in the style of *The Escapists 2*.

This game is mainly based on *This is the Police*, a text-based game where you are a police officer and you have to manage your police force and the city you are in.

Like *The Escapists*, a prison manager, or *Papers, Please*: you get notified when a problem, event, or surprise comes up. Each real-time minute maps to a certain amount of in-game time.

## The people

A fixed roster of NPCs walk around the base and can interact with each other. They follow a **schedule** you define: meal times, activities, physical training, free time, equipment maintenance, and similar.

### Stats

Everyone has two or three **hidden traits**—for example leader, angry, sleepy, non-steadfast, dumb, smart, good-handed, careful, weak, coward, brave—which affect their work, mission performance, and how they get along.

### Hunger

Each person type has a **hunger** (including nutrients) bar that rises over time and is reduced by food. Managing food has a positive effect.

### Discipline

Low discipline leads to bad behaviour. People with high hunger disobey you less often; if discipline collapses they may rebel, skip missions, and raise the chance of infiltration and successful attack.

### Fatigue

How alert someone is. Too many mission hours without enough rest fills this bar. High fatigue can especially hurt aiming on defense (and possibly training). It can also feed disobedience and stress.

### Resentments

Tied to your actions and to personality. Some people have personal requests; the group as a whole develops needs. Whether you can take certain actions, your overall stance, and how you respond all feed into this.

### Connections

Personal ties between people can be good or bad. Whether everyone gets along or cliques form affects which teams you can put together and how effective they are.

A major focus of the game is **interactivity** and the **player’s impact** on the life and state of the people—the design should make how you lead and how they react a central pillar.

## Events

### Internal

- Car breakdown
- Car checkup
- On the fire
- Too many flies
- High winds
- Heat
- Cold
- No A.C.
- Cold shower
- Gimelim
- Cat bite
- Diarrhea outbreak
- Sport injury
- Oversleep
- No breakfast / lunch / supper
- Caught with tazpitanit
- Yezuma
- Problems at home
- Lost equipment

### External

- Infiltration (attempt)
- Shooting on base
- Wartime
- Hafsad
- Mine on trail
- Pressure from own personal life
- Long higher-ups meeting
