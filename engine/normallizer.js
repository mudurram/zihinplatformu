// engine/normalizer.js

const norm = {
  reaction_speed: { mean: 450, std: 120 },
  inhibitory_control: { mean: 65, std: 18 },
  sustained_attention: { mean: 75, std: 10 }
};

export function normalizeComponents(components) {

  function normalize(val, mean, std) {
    if (val === undefined || isNaN(val)) return 50;
    if (std === 0) return 50;

    let z = (val - mean) / std;
    let scaled = 50 + z * 15;

    return Math.max(0, Math.min(100, Math.round(scaled)));
  }

  return {
    reaction_speed:
      normalize(components.reaction_speed, norm.reaction_speed.mean, norm.reaction_speed.std),

    inhibitory_control:
      normalize(components.inhibitory_control, norm.inhibitory_control.mean, norm.inhibitory_control.std),

    sustained_attention:
      normalize(components.sustained_attention, norm.sustained_attention.mean, norm.sustained_attention.std)
  };
}