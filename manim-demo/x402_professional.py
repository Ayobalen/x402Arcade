"""
x402Arcade Professional Demo Video
Clean, polished, professional - inspired by Linear, Stripe, Vercel demos
NO gimmicky effects - just beautiful typography and smooth animations
"""

from manim import *

# Exact colors from app
CYAN = "#00ffff"
MAGENTA = "#ff00ff"
GREEN = "#00ff88"
RED = "#ff3366"
PURPLE = "#8b5cf6"
BG = "#0a0a0f"
SURFACE = "#1a1a2e"

class X402Professional(Scene):
    def construct(self):
        self.camera.background_color = BG

        # Very subtle noise (barely visible)
        self.add_subtle_noise()

        # Professional scenes
        self.intro_scene()
        self.problem_scene()
        self.solution_scene()
        self.games_scene()
        self.demo_scene()
        self.impact_scene()
        self.closing_scene()

    def add_subtle_noise(self):
        """Very subtle background texture - barely noticeable"""
        noise = Rectangle(
            width=20, height=12,
            fill_opacity=0.02,
            fill_color=WHITE,
            stroke_width=0
        )
        self.add(noise)

    def intro_scene(self):
        """Clean brand introduction"""
        # Brand - large, centered, gradient
        brand = Text("x402Arcade", font_size=120, weight=BOLD)
        brand.set_color_by_gradient(CYAN, MAGENTA)

        self.play(FadeIn(brand, shift=UP * 0.2), run_time=0.8)
        self.wait(0.6)

        # Tagline - clean, simple
        tagline = Text(
            "Insert a Penny, Play for Glory",
            font_size=42,
            color="#aaaaaa"
        )
        tagline.next_to(brand, DOWN, buff=1.0)

        self.play(FadeIn(tagline), run_time=0.6)
        self.wait(0.8)

        # Smooth fade out
        self.play(
            FadeOut(brand, shift=DOWN * 0.2),
            FadeOut(tagline, shift=DOWN * 0.2),
            run_time=0.6
        )
        self.wait(0.3)

    def problem_scene(self):
        """The problem - clean layout"""
        # Title
        title = Text("The Problem", font_size=72, weight=BOLD, color=WHITE)
        title.to_edge(UP, buff=1.5)

        self.play(FadeIn(title), run_time=0.5)
        self.wait(0.4)

        # Clean equation with proper spacing
        parts = [
            Text("$0.01", font_size=80, color=GREEN, weight=BOLD),
            Text("+", font_size=60, color="#666666"),
            Text("$2.00", font_size=80, color=RED, weight=BOLD),
            Text("=", font_size=60, color="#666666"),
            Text("$2.01", font_size=90, color=RED, weight=BOLD),
        ]

        equation = VGroup(*parts)
        equation.arrange(RIGHT, buff=1.0)
        equation.move_to(ORIGIN + UP * 0.5)

        # Animate equation parts smoothly
        self.play(FadeIn(parts[0]), run_time=0.4)
        self.wait(0.2)
        self.play(FadeIn(parts[1]), run_time=0.2)
        self.wait(0.2)
        self.play(FadeIn(parts[2]), run_time=0.4)
        self.wait(0.3)
        self.play(FadeIn(parts[3]), run_time=0.2)
        self.wait(0.2)
        self.play(FadeIn(parts[4], scale=1.1), run_time=0.5)

        # Gas fee label
        label = Text("gas fee", font_size=28, color=RED)
        label.next_to(parts[2], UP, buff=0.5)
        self.play(FadeIn(label, shift=DOWN * 0.1), run_time=0.3)

        self.wait(0.6)

        # Problem statement
        problem = Text(
            "Gas fees make micropayments impossible",
            font_size=36,
            color="#888888"
        )
        problem.to_edge(DOWN, buff=1.8)

        self.play(FadeIn(problem), run_time=0.5)
        self.wait(1.0)

        # Clean exit
        self.play(
            *[FadeOut(mob) for mob in [title, *parts, label, problem]],
            run_time=0.5
        )
        self.wait(0.3)

    def solution_scene(self):
        """The solution - cards layout"""
        # Title
        title = Text("x402 Protocol", font_size=78, weight=BOLD)
        title.set_color_by_gradient(CYAN, MAGENTA)
        title.to_edge(UP, buff=1.5)

        self.play(FadeIn(title), run_time=0.5)
        self.wait(0.4)

        # Subtitle
        subtitle = Text(
            "Gasless micropayments on Cronos blockchain",
            font_size=32,
            color="#888888"
        )
        subtitle.next_to(title, DOWN, buff=0.6)

        self.play(FadeIn(subtitle), run_time=0.4)
        self.wait(0.5)

        # Benefits - clean cards
        benefits_data = [
            ("Zero Gas Fees", "Players pay $0.01, no extra costs", CYAN),
            ("Instant Settlement", "Payments confirmed in <1 second", GREEN),
            ("True Micropayments", "$0.01-$0.02 per game is viable", MAGENTA),
        ]

        cards = VGroup()
        for title_text, desc_text, color in benefits_data:
            # Clean card
            card_bg = RoundedRectangle(
                corner_radius=0.15,
                height=2.2,
                width=3.6,
                stroke_color=color,
                stroke_width=2,
                fill_color=SURFACE,
                fill_opacity=0.6
            )

            # Title
            card_title = Text(title_text, font_size=32, color=color, weight=BOLD)
            card_title.move_to(card_bg.get_top() + DOWN * 0.5)

            # Description
            card_desc = Text(desc_text, font_size=22, color="#aaaaaa")
            card_desc.move_to(card_bg.get_bottom() + UP * 0.5)
            card_desc.set_max_width(card_bg.width * 0.85)

            card = VGroup(card_bg, card_title, card_desc)
            cards.add(card)

        # Arrange horizontally
        cards.arrange(RIGHT, buff=0.7)
        cards.next_to(subtitle, DOWN, buff=1.2)

        # Smooth stagger
        for card in cards:
            self.play(FadeIn(card, shift=UP * 0.3), run_time=0.4)
            self.wait(0.2)

        self.wait(1.0)

        # Clean exit
        self.play(
            *[FadeOut(mob) for mob in [title, subtitle, cards]],
            run_time=0.5
        )
        self.wait(0.3)

    def games_scene(self):
        """Games showcase"""
        # Title
        title = Text("Classic Games", font_size=72, weight=BOLD, color=WHITE)
        title.to_edge(UP, buff=1.5)

        self.play(FadeIn(title), run_time=0.5)
        self.wait(0.4)

        # Games in 2x2 grid - clean layout
        games_data = [
            ("Snake", CYAN),
            ("Tetris", GREEN),
            ("Pong", MAGENTA),
            ("Space Invaders", PURPLE),
        ]

        game_cards = VGroup()
        for name, color in games_data:
            # Simple card
            card_bg = RoundedRectangle(
                corner_radius=0.12,
                height=1.6,
                width=2.8,
                stroke_color=color,
                stroke_width=2,
                fill_color=SURFACE,
                fill_opacity=0.5
            )

            card_text = Text(name, font_size=36, color=color, weight=BOLD)
            card_text.move_to(card_bg.get_center())

            card = VGroup(card_bg, card_text)
            game_cards.add(card)

        # Grid layout
        game_cards.arrange_in_grid(rows=2, cols=2, buff=(1.2, 0.9))
        game_cards.move_to(ORIGIN + DOWN * 0.3)

        # Quick reveal
        for card in game_cards:
            self.play(FadeIn(card, scale=0.98), run_time=0.3)

        self.wait(1.0)

        # Exit
        self.play(
            *[FadeOut(mob) for mob in [title, game_cards]],
            run_time=0.5
        )
        self.wait(0.3)

    def demo_scene(self):
        """Demo placeholder - clear instructions"""
        # Simple text
        demo_title = Text("Live Demo", font_size=80, weight=BOLD, color=CYAN)

        self.play(FadeIn(demo_title), run_time=0.5)
        self.wait(0.5)

        # Instructions
        instructions = Text(
            "[ Replace this scene with your screen recording ]\n\n"
            "Record 10-15 seconds showing:\n"
            "  • Connect wallet\n"
            "  • Play a game\n"
            "  • Win/lose with instant result\n"
            "  • Zero gas fee popup",
            font_size=28,
            color="#888888",
            line_spacing=1.5
        )
        instructions.next_to(demo_title, DOWN, buff=1.2)

        self.play(FadeIn(instructions), run_time=0.6)
        self.wait(2.0)

        # Exit
        self.play(
            FadeOut(demo_title),
            FadeOut(instructions),
            run_time=0.5
        )
        self.wait(0.3)

    def impact_scene(self):
        """Impact metrics - clean grid"""
        # Title
        title = Text("The Impact", font_size=72, weight=BOLD, color=WHITE)
        title.to_edge(UP, buff=1.5)

        self.play(FadeIn(title), run_time=0.5)
        self.wait(0.4)

        # Metrics data
        metrics_data = [
            ("$0.00", "Gas Fees", CYAN),
            ("< 1s", "Settlement", GREEN),
            ("70%", "Prize Pool", MAGENTA),
            ("200x", "Cost Reduction", PURPLE),
        ]

        metrics = VGroup()
        for value, label, color in metrics_data:
            # Clean metric card
            card_bg = RoundedRectangle(
                corner_radius=0.12,
                height=2.0,
                width=2.8,
                stroke_color=color,
                stroke_width=2,
                fill_color=SURFACE,
                fill_opacity=0.5
            )

            # Large value
            value_text = Text(value, font_size=64, color=color, weight=BOLD)
            value_text.move_to(card_bg.get_top() + DOWN * 0.7)

            # Label
            label_text = Text(label, font_size=28, color="#aaaaaa")
            label_text.move_to(card_bg.get_bottom() + UP * 0.5)

            card = VGroup(card_bg, value_text, label_text)
            metrics.add(card)

        # Grid
        metrics.arrange_in_grid(rows=2, cols=2, buff=(1.2, 0.9))
        metrics.move_to(ORIGIN + DOWN * 0.3)

        # Quick reveal
        for metric in metrics:
            self.play(FadeIn(metric, scale=0.98), run_time=0.3)

        self.wait(1.2)

        # Exit
        self.play(
            *[FadeOut(mob) for mob in [title, metrics]],
            run_time=0.5
        )
        self.wait(0.3)

    def closing_scene(self):
        """Professional closing"""
        # Logo
        logo = Text("x402Arcade", font_size=110, weight=BOLD)
        logo.set_color_by_gradient(CYAN, MAGENTA)

        self.play(FadeIn(logo, shift=UP * 0.2), run_time=0.7)
        self.wait(0.5)

        # Tagline
        tagline = Text(
            "Blockchain Gaming, Finally Affordable",
            font_size=38,
            color="#aaaaaa",
            weight=BOLD
        )
        tagline.next_to(logo, DOWN, buff=1.0)

        self.play(FadeIn(tagline), run_time=0.5)
        self.wait(0.6)

        # Links
        link = Text("x402arcade.vercel.app", font_size=32, color=CYAN)
        link.next_to(tagline, DOWN, buff=0.8)

        tech = Text("Built on Cronos zkEVM", font_size=28, color="#666666")
        tech.next_to(link, DOWN, buff=0.5)

        self.play(FadeIn(link), run_time=0.4)
        self.wait(0.3)
        self.play(FadeIn(tech), run_time=0.4)
        self.wait(1.5)

        # Smooth fade to black
        self.play(
            *[FadeOut(mob) for mob in [logo, tagline, link, tech]],
            run_time=1.0
        )


if __name__ == "__main__":
    import subprocess
    subprocess.run(["manim", "-pql", __file__, "X402Professional"])
