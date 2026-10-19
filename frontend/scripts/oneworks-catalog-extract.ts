// Runs in a temporary checkout of the pinned OneWorks source. Every template
// comes from the upstream preset model; the app does not redraw the artwork.
import fs from "node:fs";
import path from "node:path";
import {
  createDefaultAvatarDefinition,
  getAvatarPalette,
  parseAvatarDefinition,
  resolveAvatarCoatPatternDecals
} from "@oneworks/avatar";
import {
  avatarDefinitionToState,
  createAvatarDefinition
} from "./avatarDefinition";
import {
  createAvatarEntityParts,
  getAvatarEntityPresetFaceStyle,
  getAvatarEntityPresetScene
} from "./avatarEntityPresets";
import {
  getAvatarBearBreedTemplate,
  getAvatarCatBreedTemplate,
  getAvatarDogBreedTemplate,
  getAvatarRabbitBreedTemplate,
  resolveAvatarBearBreedTemplate,
  resolveAvatarCatBreedTemplate,
  resolveAvatarDogBreedTemplate,
  resolveAvatarRabbitBreedTemplate
} from "./avatarBreedTemplates";
import { resolveAvatarBreedPaletteFromEntityParts } from "./avatarBreedTone";
import {
  getAvatarAnimalBreedTemplate,
  resolveAvatarAnimalBreedTemplate
} from "./avatarSpeciesBreeds";

const output = process.argv[2];
const snapshots = path.join(__dirname, "avatarPresetSnapshots");
const seed = "v1-0auditfixed000000000"; // Same seed as the upstream gallery snapshots.
const templates = [
  ...fs
    .readdirSync(snapshots)
    .filter(file => file.endsWith(".svg"))
    .map(file => ({
      slug: path.basename(file, ".svg"),
      species: path.basename(file, ".svg"),
      breed: null,
      source: path.join(snapshots, file)
    })),
  ...fs
    .readdirSync(path.join(snapshots, "breeds"))
    .filter(file => file.endsWith(".svg"))
    .map(file => {
      const slug = path.basename(file, ".svg");
      const [species, breed] = slug.split("--", 2);
      return {
        slug,
        species,
        breed,
        source: path.join(snapshots, "breeds", file)
      };
    })
].sort((a, b) => a.slug.localeCompare(b.slug));

fs.mkdirSync(output, { recursive: true });
for (const template of templates) {
  const scene = getAvatarEntityPresetScene(template.species);
  if (!scene) throw new Error(`Unknown OneWorks preset: ${template.slug}`);
  const base = avatarDefinitionToState(createDefaultAvatarDefinition());
  let entityParts = createAvatarEntityParts(template.species);
  let faceStyle =
    getAvatarEntityPresetFaceStyle(template.species) || base.faceStyle;
  let paletteId = scene.paletteId;
  let coatPattern = base.coatPattern;
  let surfaceDecals = scene.surfaceDecals || [];
  let previewBackground;

  if (template.breed) {
    const species = template.species;
    const id = template.breed;
    const breed =
      species === "cat"
        ? getAvatarCatBreedTemplate(id)
        : species === "dog"
          ? getAvatarDogBreedTemplate(id)
          : species === "rabbit"
            ? getAvatarRabbitBreedTemplate(id)
            : species === "bear"
              ? getAvatarBearBreedTemplate(id)
              : getAvatarAnimalBreedTemplate(species, id);
    if (!breed) throw new Error(`Unknown OneWorks breed: ${template.slug}`);
    const resolved =
      species === "cat"
        ? resolveAvatarCatBreedTemplate(breed, seed)
        : species === "dog"
          ? resolveAvatarDogBreedTemplate(breed, seed)
          : species === "rabbit"
            ? resolveAvatarRabbitBreedTemplate(breed, seed)
            : species === "bear"
              ? resolveAvatarBearBreedTemplate(breed, seed)
              : resolveAvatarAnimalBreedTemplate(breed, seed);
    entityParts = resolved.entityParts;
    paletteId = resolved.paletteId;
    coatPattern = resolved.coatPattern;
    faceStyle = resolved.faceStyle || faceStyle;
    previewBackground = breed.previewBackground;
    surfaceDecals = [
      ...resolveAvatarCoatPatternDecals({
        entityParts,
        entityPreset: species,
        palette: resolveAvatarBreedPaletteFromEntityParts(
          getAvatarPalette(paletteId),
          entityParts
        ),
        paletteId,
        pattern: coatPattern
      }),
      ...(resolved.surfaceDecals || [])
    ];
  }

  const definition = createAvatarDefinition({
    ...base,
    ...scene,
    bodyShape: "sphere",
    cameraBackground: previewBackground || scene.cameraBackground,
    entityParts,
    entityPreset: template.species,
    exportSize: 256,
    faceStyle,
    paletteId,
    coatPattern,
    surfaceDecals: surfaceDecals.filter(
      decal =>
        !decal.targetPartId ||
        entityParts.some(part => part.id === decal.targetPartId)
    )
  });
  try {
    parseAvatarDefinition(JSON.stringify(definition));
  } catch (error) {
    throw new Error(`Invalid upstream definition for ${template.slug}`, {
      cause: error
    });
  }
  fs.copyFileSync(template.source, path.join(output, `${template.slug}.svg`));
  fs.writeFileSync(
    path.join(output, `${template.slug}.json`),
    JSON.stringify(definition)
  );
}
fs.writeFileSync(
  path.join(output, "templates.json"),
  JSON.stringify(templates.map(template => template.slug)) + "\n"
);
process.stdout.write(
  `Exported ${templates.length} official OneWorks templates\n`
);
