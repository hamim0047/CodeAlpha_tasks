from generator import MusicGenerator

generator = MusicGenerator()

tokens = generator.generate(
    length=64,
    temperature=0.9,
)

path = generator.tokens_to_midi(tokens)

print("Generated tokens:")
print(tokens[:20])
print()
print(f"MIDI saved to: {path}")
