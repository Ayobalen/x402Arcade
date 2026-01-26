"""
x402Arcade Demo - ULTRA SIMPLE VERSION
No glow effects, no VGroups, just basic text and shapes
"""

from manim import *

# Colors
CYAN = "#00ffff"
MAGENTA = "#ff00ff"
GREEN = "#00ff88"
RED = "#ff3366"
BG = "#0a0a0f"

class X402Simple(Scene):
    def construct(self):
        self.camera.background_color = BG

        # Scene 1: Brand (0-5s)
        brand = Text("x402Arcade", font_size=110, weight=BOLD, color=CYAN)
        self.play(FadeIn(brand), run_time=0.5)
        self.wait(1)

        tagline = Text("Insert a Penny, Play for Glory", font_size=36, color=WHITE)
        tagline.next_to(brand, DOWN, buff=0.8)
        self.play(Write(tagline), run_time=0.5)
        self.wait(1)

        self.play(FadeOut(brand), FadeOut(tagline), run_time=0.5)

        # Scene 2: Problem (5-10s)
        title = Text("The Problem", font_size=60, weight=BOLD, color=RED)
        title.to_edge(UP, buff=1)
        self.play(FadeIn(title), run_time=0.4)
        self.wait(0.3)

        eq1 = Text("$0.01", font_size=70, color=GREEN, weight=BOLD)
        plus = Text("+", font_size=70, color=WHITE)
        eq2 = Text("$2.00", font_size=70, color=RED, weight=BOLD)
        eq = Text("=", font_size=70, color=WHITE)
        total = Text("$2.01", font_size=80, color=RED, weight=BOLD)

        equation = VGroup(eq1, plus, eq2, eq, total)
        equation.arrange(RIGHT, buff=0.7)

        self.play(Write(equation), run_time=1)
        self.wait(1)

        problem = Text("200x MORE EXPENSIVE", font_size=48, color=RED, weight=BOLD)
        problem.to_edge(DOWN, buff=1.2)
        self.play(Write(problem), run_time=0.5)
        self.wait(1)

        self.play(FadeOut(title), FadeOut(equation), FadeOut(problem), run_time=0.4)

        # Scene 3: Solution (10-15s)
        solution = Text("x402 Protocol", font_size=70, weight=BOLD, color=CYAN)
        self.play(FadeIn(solution), run_time=0.5)
        self.wait(0.5)

        subtitle = Text("Gasless Micropayments on Cronos", font_size=32, color=MAGENTA)
        subtitle.next_to(solution, DOWN, buff=0.6)
        self.play(Write(subtitle), run_time=0.5)
        self.wait(1)

        self.play(FadeOut(solution), FadeOut(subtitle), run_time=0.4)

        # Scene 4: Games (15-20s)
        games_title = Text("Classic Arcade Games", font_size=60, weight=BOLD, color=MAGENTA)
        games_title.to_edge(UP, buff=1)
        self.play(FadeIn(games_title), run_time=0.4)

        game1 = Text("Snake", font_size=40, color=CYAN, weight=BOLD)
        game2 = Text("Tetris", font_size=40, color=GREEN, weight=BOLD)
        game3 = Text("Pong", font_size=40, color=MAGENTA, weight=BOLD)
        game4 = Text("Space Invaders", font_size=40, color=RED, weight=BOLD)

        games = VGroup(game1, game2, game3, game4)
        games.arrange_in_grid(rows=2, cols=2, buff=(1.5, 1.0))

        for game in games:
            self.play(FadeIn(game), run_time=0.3)

        self.wait(1)
        self.play(FadeOut(games_title), FadeOut(games), run_time=0.4)

        # Scene 5: Impact (20-25s)
        impact = Text("The Impact", font_size=70, weight=BOLD, color=GREEN)
        impact.to_edge(UP, buff=1)
        self.play(FadeIn(impact), run_time=0.4)

        m1 = Text("$0.00 Gas Fees", font_size=36, color=CYAN, weight=BOLD)
        m2 = Text("<1s Settlement", font_size=36, color=GREEN, weight=BOLD)
        m3 = Text("70% Prize Pool", font_size=36, color=MAGENTA, weight=BOLD)
        m4 = Text("200x Cheaper", font_size=36, color=RED, weight=BOLD)

        metrics = VGroup(m1, m2, m3, m4)
        metrics.arrange_in_grid(rows=2, cols=2, buff=(1.5, 1.0))

        for metric in metrics:
            self.play(FadeIn(metric), run_time=0.3)

        self.wait(1)
        self.play(FadeOut(impact), FadeOut(metrics), run_time=0.4)

        # Scene 6: Closing (25-30s)
        logo = Text("x402Arcade", font_size=90, weight=BOLD, color=MAGENTA)
        self.play(FadeIn(logo), run_time=0.5)
        self.wait(0.4)

        closing = Text("Blockchain Gaming, Finally Affordable", font_size=36, color=CYAN, weight=BOLD)
        closing.next_to(logo, DOWN, buff=0.8)
        self.play(Write(closing), run_time=0.5)
        self.wait(1)

        link = Text("x402arcade.vercel.app", font_size=32, color=WHITE)
        link.next_to(closing, DOWN, buff=0.8)
        self.play(FadeIn(link), run_time=0.4)
        self.wait(1.5)

        self.play(FadeOut(logo), FadeOut(closing), FadeOut(link), run_time=0.8)


if __name__ == "__main__":
    import subprocess
    subprocess.run(["manim", "-pql", __file__, "X402Simple"])
