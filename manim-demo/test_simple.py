from manim import *

class SimpleTest(Scene):
    def construct(self):
        # Very simple test - just text on screen
        self.camera.background_color = "#0a0a0f"

        # Big white text
        text = Text("HELLO x402Arcade", font_size=96, color=WHITE)
        self.add(text)
        self.wait(2)
