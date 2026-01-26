"""
x402Arcade Demo - WITH ARCADE GLITCHES & NOISE
Inspired by the actual homepage design
"""

from manim import *
import random

# Colors from actual app
CYAN = "#00ffff"
MAGENTA = "#ff00ff"
GREEN = "#00ff88"
RED = "#ff3366"
BG = "#0a0a0f"

class X402ArcadeStyle(Scene):
    def construct(self):
        self.camera.background_color = BG

        # Add noise overlay to entire scene
        self.add_noise_overlay()

        # Scene 1: Brand with glitch effect (0-5s)
        self.scene_1_brand_glitch()

        # Scene 2: Problem (5-10s)
        self.scene_2_problem()

        # Scene 3: Solution (10-15s)
        self.scene_3_solution()

        # Scene 4: Games (15-20s)
        self.scene_4_games()

        # Scene 5: Demo Instruction (20-25s)
        self.scene_5_demo_instruction()

        # Scene 6: Impact (25-30s)
        self.scene_6_impact()

        # Scene 7: Closing (30-35s)
        self.scene_7_closing()

    def add_noise_overlay(self):
        """Add constant noise overlay for arcade feel"""
        # Create scanlines effect
        scanlines = VGroup(*[
            Line(
                start=LEFT * 20,
                end=RIGHT * 20,
                stroke_width=1,
                stroke_opacity=0.03,
                color=WHITE
            ).shift(UP * i * 0.1)
            for i in range(-40, 40)
        ])
        self.add(scanlines)

    def glitch_text(self, text_mob, duration=0.3):
        """Apply glitch effect to text"""
        original_pos = text_mob.get_center()

        # Quick glitch shake
        for _ in range(3):
            shift = random.choice([LEFT, RIGHT, UP, DOWN]) * random.uniform(0.05, 0.15)
            self.play(
                text_mob.animate.shift(shift).set_opacity(0.8),
                rate_func=linear,
                run_time=0.05
            )
            self.play(
                text_mob.animate.move_to(original_pos).set_opacity(1),
                rate_func=linear,
                run_time=0.05
            )

    def scene_1_brand_glitch(self):
        """Brand intro with glitch effect"""
        # Main brand text
        brand = Text("x402Arcade", font_size=110, weight=BOLD)
        brand.set_color_by_gradient(CYAN, MAGENTA)

        self.play(FadeIn(brand, scale=0.9), run_time=0.5)

        # Apply glitch effect
        self.glitch_text(brand, 0.3)
        self.wait(0.3)

        # Tagline
        tagline = Text(
            "Insert a Penny,\nPlay for Glory",
            font_size=44,
            color=WHITE,
            line_spacing=1.2
        )
        tagline.next_to(brand, DOWN, buff=0.9)

        self.play(Write(tagline), run_time=0.7)
        self.wait(0.5)

        # Quick glitch on tagline
        self.glitch_text(tagline, 0.2)
        self.wait(0.5)

        self.play(FadeOut(brand), FadeOut(tagline), run_time=0.4)

    def scene_2_problem(self):
        """The Problem scene"""
        title = Text("The Problem", font_size=64, weight=BOLD, color=RED)
        title.to_edge(UP, buff=1.2)
        self.play(FadeIn(title), run_time=0.4)
        self.wait(0.2)

        # Equation
        game = Text("$0.01", font_size=72, color=GREEN, weight=BOLD)
        plus = Text("+", font_size=72, color=WHITE)
        gas = Text("$2.00", font_size=72, color=RED, weight=BOLD)
        eq = Text("=", font_size=72, color=WHITE)
        total = Text("$2.01", font_size=84, color=RED, weight=BOLD)

        equation = VGroup(game, plus, gas, eq, total)
        equation.arrange(RIGHT, buff=0.8)

        self.play(Write(equation), run_time=0.8)

        # Glitch the gas fee
        self.wait(0.2)
        self.glitch_text(gas, 0.2)
        self.wait(0.3)

        problem = Text("Gas fees destroy\nmicropayments", font_size=42, color=RED, weight=BOLD, line_spacing=1.2)
        problem.to_edge(DOWN, buff=1.2)
        self.play(Write(problem), run_time=0.5)
        self.wait(0.8)

        self.play(FadeOut(title), FadeOut(equation), FadeOut(problem), run_time=0.4)

    def scene_3_solution(self):
        """The Solution scene"""
        solution = Text("x402 Protocol", font_size=72, weight=BOLD)
        solution.set_color_by_gradient(CYAN, MAGENTA)

        self.play(FadeIn(solution), run_time=0.5)
        self.glitch_text(solution, 0.2)
        self.wait(0.3)

        subtitle = Text("Gasless Payments\non Cronos", font_size=36, color=CYAN, line_spacing=1.2)
        subtitle.next_to(solution, DOWN, buff=0.7)
        self.play(Write(subtitle), run_time=0.5)
        self.wait(0.5)

        # Benefits
        b1 = Text("Zero Gas Fees", font_size=38, color=CYAN, weight=BOLD)
        b2 = Text("Sub-Second Speed", font_size=38, color=GREEN, weight=BOLD)
        b3 = Text("$0.01-$0.02 per game", font_size=38, color=MAGENTA, weight=BOLD)

        benefits = VGroup(b1, b2, b3)
        benefits.arrange(DOWN, buff=0.6, aligned_edge=LEFT)
        benefits.next_to(subtitle, DOWN, buff=1.0)

        for benefit in benefits:
            self.play(FadeIn(benefit, shift=RIGHT * 0.3), run_time=0.3)

        self.wait(0.8)
        self.play(
            FadeOut(solution), FadeOut(subtitle), FadeOut(benefits),
            run_time=0.4
        )

    def scene_4_games(self):
        """Show the games"""
        title = Text("Classic Games", font_size=64, weight=BOLD, color=MAGENTA)
        title.to_edge(UP, buff=1.2)
        self.play(FadeIn(title), run_time=0.4)
        self.glitch_text(title, 0.2)
        self.wait(0.2)

        games = [
            Text("🐍 Snake", font_size=42, color=CYAN, weight=BOLD),
            Text("🧱 Tetris", font_size=42, color=GREEN, weight=BOLD),
            Text("🏓 Pong", font_size=42, color=MAGENTA, weight=BOLD),
            Text("👾 Space Invaders", font_size=42, color=RED, weight=BOLD),
        ]

        games_group = VGroup(*games)
        games_group.arrange_in_grid(rows=2, cols=2, buff=(1.8, 1.0))

        for game in games:
            self.play(FadeIn(game, scale=0.95), run_time=0.25)

        self.wait(0.8)
        self.play(FadeOut(title), FadeOut(games_group), run_time=0.4)

    def scene_5_demo_instruction(self):
        """Demo section with clear instruction"""
        demo_text = Text(
            "[ LIVE DEMO ]",
            font_size=72,
            weight=BOLD,
            color=CYAN
        )

        self.play(FadeIn(demo_text), run_time=0.5)
        self.glitch_text(demo_text, 0.3)
        self.wait(0.3)

        instruction = Text(
            "Insert your screen recording here:\n\n"
            "• Connect wallet\n"
            "• Play a game\n"
            "• Zero gas fee\n"
            "• Instant result",
            font_size=32,
            color=WHITE,
            line_spacing=1.4
        )
        instruction.next_to(demo_text, DOWN, buff=1.0)

        self.play(Write(instruction), run_time=0.8)
        self.wait(1.2)

        self.play(FadeOut(demo_text), FadeOut(instruction), run_time=0.4)

    def scene_6_impact(self):
        """Impact metrics"""
        title = Text("The Impact", font_size=72, weight=BOLD, color=GREEN)
        title.to_edge(UP, buff=1.2)
        self.play(FadeIn(title), run_time=0.4)
        self.glitch_text(title, 0.2)
        self.wait(0.2)

        metrics = [
            Text("$0.00\nGas Fees", font_size=40, color=CYAN, weight=BOLD, line_spacing=1.2),
            Text("< 1s\nSettlement", font_size=40, color=GREEN, weight=BOLD, line_spacing=1.2),
            Text("70%\nPrize Pool", font_size=40, color=MAGENTA, weight=BOLD, line_spacing=1.2),
            Text("200x\nCheaper", font_size=40, color=RED, weight=BOLD, line_spacing=1.2),
        ]

        metrics_group = VGroup(*metrics)
        metrics_group.arrange_in_grid(rows=2, cols=2, buff=(1.8, 1.2))

        for metric in metrics:
            self.play(FadeIn(metric, scale=0.95), run_time=0.25)

        self.wait(1.0)
        self.play(FadeOut(title), FadeOut(metrics_group), run_time=0.4)

    def scene_7_closing(self):
        """Closing with logo"""
        logo = Text("x402Arcade", font_size=100, weight=BOLD)
        logo.set_color_by_gradient(CYAN, MAGENTA)

        self.play(FadeIn(logo, scale=0.9), run_time=0.6)
        self.glitch_text(logo, 0.3)
        self.wait(0.3)

        tagline = Text(
            "Blockchain Gaming,\nFinally Affordable",
            font_size=40,
            color=CYAN,
            weight=BOLD,
            line_spacing=1.3
        )
        tagline.next_to(logo, DOWN, buff=0.9)
        self.play(Write(tagline), run_time=0.6)
        self.wait(0.4)

        links = VGroup(
            Text("x402arcade.vercel.app", font_size=34, color=WHITE),
            Text("Built on Cronos zkEVM", font_size=30, color=MAGENTA),
        )
        links.arrange(DOWN, buff=0.5)
        links.next_to(tagline, DOWN, buff=0.9)

        self.play(FadeIn(links), run_time=0.5)
        self.wait(1.5)

        # Final glitch
        self.glitch_text(logo, 0.2)
        self.wait(0.3)

        self.play(
            FadeOut(logo), FadeOut(tagline), FadeOut(links),
            run_time=0.8
        )


if __name__ == "__main__":
    import subprocess
    subprocess.run(["manim", "-pql", __file__, "X402ArcadeStyle"])
