"""
x402Arcade Final Demo - SIMPLE AND CLEAN
Fixed absolute positioning - no relative positioning bugs
"""

from manim import *

# Colors
CYAN = "#00ffff"
MAGENTA = "#ff00ff"
GREEN = "#00ff88"
RED = "#ff3366"
BG = "#0a0a0f"

class X402Final(Scene):
    def construct(self):
        self.camera.background_color = BG

        # Scene 1: Intro (0-4s)
        self.intro()

        # Scene 2: Problem (4-9s)
        self.problem()

        # Scene 3: Solution (9-14s)
        self.solution()

        # Scene 4: Games (14-18s)
        self.games()

        # Scene 5: Demo (18-22s)
        self.demo()

        # Scene 6: Impact (22-27s)
        self.impact()

        # Scene 7: Closing (27-32s)
        self.closing()

    def intro(self):
        """Simple intro"""
        brand = Text("x402Arcade", font_size=100, weight=BOLD)
        brand.set_color_by_gradient(CYAN, MAGENTA)

        tagline = Text("Insert a Penny, Play for Glory", font_size=36, color=WHITE)
        tagline.move_to(DOWN * 1.2)

        self.play(FadeIn(brand), run_time=0.6)
        self.wait(0.4)
        self.play(FadeIn(tagline), run_time=0.5)
        self.wait(1.0)
        self.play(FadeOut(brand), FadeOut(tagline), run_time=0.5)

    def problem(self):
        """Problem scene - fixed positioning"""
        # Title at top
        title = Text("The Problem", font_size=60, weight=BOLD, color=WHITE)
        title.move_to(UP * 3)

        self.play(FadeIn(title), run_time=0.4)
        self.wait(0.3)

        # Equation - manually positioned
        game = Text("$0.01", font_size=70, color=GREEN, weight=BOLD)
        game.move_to(LEFT * 4 + UP * 0.5)

        plus = Text("+", font_size=60, color=WHITE)
        plus.move_to(LEFT * 2 + UP * 0.5)

        gas = Text("$2.00", font_size=70, color=RED, weight=BOLD)
        gas.move_to(ORIGIN + UP * 0.5)

        equals = Text("=", font_size=60, color=WHITE)
        equals.move_to(RIGHT * 2 + UP * 0.5)

        total = Text("$2.01", font_size=80, color=RED, weight=BOLD)
        total.move_to(RIGHT * 4 + UP * 0.5)

        # Gas fee label ABOVE the gas amount
        gas_label = Text("gas fee", font_size=24, color=RED)
        gas_label.move_to(ORIGIN + UP * 1.5)

        # Build equation
        self.play(FadeIn(game), run_time=0.3)
        self.play(FadeIn(plus), run_time=0.2)
        self.play(FadeIn(gas), FadeIn(gas_label), run_time=0.4)
        self.wait(0.3)
        self.play(FadeIn(equals), run_time=0.2)
        self.play(FadeIn(total), run_time=0.4)
        self.wait(0.5)

        # Problem text at bottom
        problem = Text("Gas fees destroy micropayments", font_size=32, color="#888888")
        problem.move_to(DOWN * 2.5)

        self.play(FadeIn(problem), run_time=0.4)
        self.wait(0.8)

        self.play(
            *[FadeOut(m) for m in [title, game, plus, gas, gas_label, equals, total, problem]],
            run_time=0.5
        )

    def solution(self):
        """Solution scene - simple layout"""
        title = Text("x402 Protocol", font_size=70, weight=BOLD)
        title.set_color_by_gradient(CYAN, MAGENTA)
        title.move_to(UP * 3)

        subtitle = Text("Gasless Micropayments", font_size=30, color="#888888")
        subtitle.move_to(UP * 2.2)

        self.play(FadeIn(title), run_time=0.5)
        self.play(FadeIn(subtitle), run_time=0.4)
        self.wait(0.5)

        # Three simple text lines
        b1 = Text("Zero Gas Fees", font_size=36, color=CYAN, weight=BOLD)
        b1.move_to(UP * 0.8)

        b2 = Text("Instant Settlement", font_size=36, color=GREEN, weight=BOLD)
        b2.move_to(ORIGIN)

        b3 = Text("$0.01-$0.02 per game", font_size=36, color=MAGENTA, weight=BOLD)
        b3.move_to(DOWN * 0.8)

        for b in [b1, b2, b3]:
            self.play(FadeIn(b), run_time=0.3)
            self.wait(0.2)

        self.wait(0.7)

        self.play(
            *[FadeOut(m) for m in [title, subtitle, b1, b2, b3]],
            run_time=0.5
        )

    def games(self):
        """Games scene"""
        title = Text("Classic Games", font_size=60, weight=BOLD, color=WHITE)
        title.move_to(UP * 3)

        self.play(FadeIn(title), run_time=0.4)
        self.wait(0.3)

        # 2x2 grid - manually positioned
        g1 = Text("Snake", font_size=40, color=CYAN, weight=BOLD)
        g1.move_to(LEFT * 2 + UP * 0.8)

        g2 = Text("Tetris", font_size=40, color=GREEN, weight=BOLD)
        g2.move_to(RIGHT * 2 + UP * 0.8)

        g3 = Text("Pong", font_size=40, color=MAGENTA, weight=BOLD)
        g3.move_to(LEFT * 2 + DOWN * 0.8)

        g4 = Text("Space Invaders", font_size=40, color=RED, weight=BOLD)
        g4.move_to(RIGHT * 2 + DOWN * 0.8)

        for g in [g1, g2, g3, g4]:
            self.play(FadeIn(g), run_time=0.25)

        self.wait(0.8)

        self.play(
            *[FadeOut(m) for m in [title, g1, g2, g3, g4]],
            run_time=0.5
        )

    def demo(self):
        """Demo placeholder"""
        title = Text("Live Demo", font_size=70, weight=BOLD, color=CYAN)

        instruction = Text(
            "[ Insert screen recording here ]",
            font_size=28,
            color="#666666"
        )
        instruction.move_to(DOWN * 1)

        self.play(FadeIn(title), run_time=0.5)
        self.play(FadeIn(instruction), run_time=0.4)
        self.wait(2.0)

        self.play(FadeOut(title), FadeOut(instruction), run_time=0.5)

    def impact(self):
        """Impact metrics"""
        title = Text("The Impact", font_size=60, weight=BOLD, color=WHITE)
        title.move_to(UP * 3)

        self.play(FadeIn(title), run_time=0.4)
        self.wait(0.3)

        # 2x2 grid
        m1_val = Text("$0.00", font_size=50, color=CYAN, weight=BOLD)
        m1_val.move_to(LEFT * 2.5 + UP * 0.8)
        m1_lab = Text("Gas Fees", font_size=24, color="#888888")
        m1_lab.move_to(LEFT * 2.5 + UP * 0.2)

        m2_val = Text("< 1s", font_size=50, color=GREEN, weight=BOLD)
        m2_val.move_to(RIGHT * 2.5 + UP * 0.8)
        m2_lab = Text("Settlement", font_size=24, color="#888888")
        m2_lab.move_to(RIGHT * 2.5 + UP * 0.2)

        m3_val = Text("70%", font_size=50, color=MAGENTA, weight=BOLD)
        m3_val.move_to(LEFT * 2.5 + DOWN * 1.2)
        m3_lab = Text("Prize Pool", font_size=24, color="#888888")
        m3_lab.move_to(LEFT * 2.5 + DOWN * 1.8)

        m4_val = Text("200x", font_size=50, color=RED, weight=BOLD)
        m4_val.move_to(RIGHT * 2.5 + DOWN * 1.2)
        m4_lab = Text("Cheaper", font_size=24, color="#888888")
        m4_lab.move_to(RIGHT * 2.5 + DOWN * 1.8)

        for val, lab in [(m1_val, m1_lab), (m2_val, m2_lab), (m3_val, m3_lab), (m4_val, m4_lab)]:
            self.play(FadeIn(val), FadeIn(lab), run_time=0.25)

        self.wait(1.0)

        self.play(
            *[FadeOut(m) for m in [title, m1_val, m1_lab, m2_val, m2_lab, m3_val, m3_lab, m4_val, m4_lab]],
            run_time=0.5
        )

    def closing(self):
        """Closing"""
        logo = Text("x402Arcade", font_size=90, weight=BOLD)
        logo.set_color_by_gradient(CYAN, MAGENTA)
        logo.move_to(UP * 0.8)

        tagline = Text("Blockchain Gaming, Finally Affordable", font_size=34, color="#aaaaaa", weight=BOLD)
        tagline.move_to(DOWN * 0.2)

        link = Text("x402arcade.vercel.app", font_size=28, color=CYAN)
        link.move_to(DOWN * 1.2)

        self.play(FadeIn(logo), run_time=0.6)
        self.wait(0.4)
        self.play(FadeIn(tagline), run_time=0.5)
        self.wait(0.4)
        self.play(FadeIn(link), run_time=0.4)
        self.wait(1.5)

        self.play(FadeOut(logo), FadeOut(tagline), FadeOut(link), run_time=0.8)


if __name__ == "__main__":
    import subprocess
    subprocess.run(["manim", "-pql", __file__, "X402Final"])
