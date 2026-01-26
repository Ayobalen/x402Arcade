"""
x402Arcade Demo Animation
Professional 3Blue1Brown-style explainer using REAL app info, design tokens, and story

Real Info:
- Tagline: "Insert a Penny, Play for Glory"
- Games: Snake, Tetris, Pong, Space Invaders
- Pricing: $0.01-$0.02 USDC per game
- Prize Pool: 70% of all payments
- Tech: Cronos blockchain, x402 Protocol, EIP-3009

Run with:
manim -pql x402_demo.py X402Demo   # Low quality preview
manim -pqh x402_demo.py X402Demo   # High quality production
"""

from manim import *

# x402Arcade color palette (EXACT from variables.css)
CYAN = "#00ffff"
MAGENTA = "#ff00ff"
GREEN = "#00ff88"
RED = "#ff3366"
ORANGE = "#ffaa00"
BG_PRIMARY = "#0a0a0f"
BG_SECONDARY = "#12121a"
BG_TERTIARY = "#1a1a2e"
SURFACE_PRIMARY = "#1e1e2e"

# Real spacing values (converted from rem to Manim units)
SPACING_8 = 2.0   # 2rem = 32px
SPACING_12 = 3.0  # 3rem = 48px
SPACING_16 = 4.0  # 4rem = 64px


class X402Demo(Scene):
    def construct(self):
        # Set background color (exact from app)
        self.camera.background_color = BG_PRIMARY

        # Scene 1: Brand Intro (0-5s)
        self.scene_1_intro()

        # Scene 2: The Problem (5-10s)
        self.scene_2_problem()

        # Scene 3: The Solution (10-17s)
        self.scene_3_solution()

        # Scene 4: The Games (17-23s)
        self.scene_4_games()

        # Scene 5: Live Demo Placeholder (23-28s)
        self.scene_5_demo_placeholder()

        # Scene 6: The Impact (28-34s)
        self.scene_6_impact()

        # Scene 7: Closing CTA (34-40s)
        self.scene_7_closing()

    def scene_1_intro(self):
        """Scene 1: x402Arcade Brand Introduction"""

        # Brand name (big, bold, gradient) - using default font
        brand = Text("x402Arcade", font_size=110, weight=BOLD)
        brand.set_color_by_gradient(CYAN, MAGENTA)

        # Animate brand appearing
        self.play(
            FadeIn(brand, scale=0.85),
            run_time=0.7
        )
        self.wait(0.4)

        # Tagline (REAL tagline from README)
        tagline = Text(
            '"Insert a Penny, Play for Glory"',
            font_size=40,
            color=WHITE,
            slant=ITALIC
        )
        tagline.next_to(brand, DOWN, buff=1.2)

        self.play(Write(tagline), run_time=0.7)
        self.wait(0.6)

        # Subtitle
        subtitle = Text(
            "Arcade Gaming on Cronos",
            font_size=32,
            color=CYAN
        )
        subtitle.next_to(tagline, DOWN, buff=0.8)

        self.play(FadeIn(subtitle, shift=UP * 0.3), run_time=0.5)
        self.wait(0.8)

        # Clear
        self.play(
            *[FadeOut(mob) for mob in [brand, tagline, subtitle]],
            run_time=0.4
        )

    def scene_2_problem(self):
        """Scene 2: The Problem - Gas fees destroy micropayments"""

        # Title
        title = Text("The Problem", font_size=68, weight=BOLD, color=RED)
        title.to_edge(UP, buff=1.2)
        self.play(FadeIn(title, scale=0.95), run_time=0.5)
        self.wait(0.3)

        # Build equation with proper spacing
        game_cost = Text("$0.01", font_size=76, color=GREEN, weight=BOLD)
        plus_sign = Text("+", font_size=76, color=WHITE)
        gas_fee = Text("$2.00", font_size=76, color=RED, weight=BOLD)
        equals = Text("=", font_size=76, color=WHITE)
        total = Text("$2.01", font_size=90, color=RED, weight=BOLD)

        # Gas fee label (proper spacing above)
        gas_label = Text("gas fee", font_size=32, color=RED)
        gas_label.next_to(gas_fee, UP, buff=0.6)

        # Arrange equation with generous spacing
        equation = VGroup(game_cost, plus_sign, gas_fee, equals, total)
        equation.arrange(RIGHT, buff=0.9)
        equation.move_to(ORIGIN + DOWN * 0.3)

        # Build equation
        self.play(FadeIn(game_cost, shift=DOWN * 0.3), run_time=0.4)
        self.play(Write(plus_sign), run_time=0.2)
        self.play(
            FadeIn(gas_fee, scale=1.2),
            FadeIn(gas_label, shift=DOWN * 0.2),
            run_time=0.5
        )

        # Quick shake effect
        for _ in range(2):
            self.play(
                gas_fee.animate.shift(LEFT * 0.18),
                rate_func=there_and_back,
                run_time=0.09
            )

        self.play(Write(equals), run_time=0.2)
        self.play(FadeIn(total, scale=1.15), run_time=0.5)

        # Problem statement (proper spacing from bottom)
        problem = Text(
            "200x MORE EXPENSIVE",
            font_size=54,
            color=RED,
            weight=BOLD,
            font="Helvetica Neue"
        ).to_edge(DOWN, buff=1.5)

        self.play(Write(problem), run_time=0.6)
        self.wait(0.7)

        # Clear
        self.play(
            *[FadeOut(mob) for mob in [title, game_cost, plus_sign, gas_fee, gas_label,
                                        equals, total, problem]],
            run_time=0.4
        )

    def scene_3_solution(self):
        """Scene 3: The Solution - x402 Protocol explanation"""

        # Title with intense glow
        title = Text("x402 Protocol", font_size=78, weight=BOLD)
        title.set_color_by_gradient(CYAN, MAGENTA)
        title_glow = title.copy().set_stroke(CYAN, width=20, opacity=0.7)
        title_group = VGroup(title_glow, title)
        title_group.to_edge(UP, buff=1.0)

        self.play(FadeIn(title_group, scale=0.9), run_time=0.6)
        self.wait(0.3)

        # Subtitle
        subtitle = Text(
            "Gasless Micropayments on Cronos",
            font_size=38,
            color=CYAN,
            font="Helvetica Neue"
        ).next_to(title_group, DOWN, buff=0.8)

        self.play(Write(subtitle), run_time=0.5)
        self.wait(0.4)

        # Shrink title and subtitle
        self.play(
            VGroup(title_group, subtitle).animate.scale(0.65).to_edge(UP, buff=0.7),
            run_time=0.5
        )

        # Benefits (larger cards, more padding)
        benefits = [
            ("Zero Gas Fees", "Players pay nothing", CYAN),
            ("Sub-Second", "Instant gameplay", GREEN),
            ("True Micropayments", "$0.01-$0.02 per game", MAGENTA),
        ]

        cards = VGroup()
        for benefit_title, desc, color in benefits:
            # Card with proper padding
            rect = RoundedRectangle(
                corner_radius=0.3,
                height=2.6,
                width=3.8,
                stroke_color=color,
                stroke_width=5,
                fill_color=BG_SECONDARY,
                fill_opacity=0.95
            )

            # Title (larger font, proper spacing)
            title_text = Text(benefit_title, font_size=38, color=color, weight=BOLD)
            title_text.move_to(rect.get_center() + UP * 0.45)

            # Description (proper spacing below)
            desc_text = Text(desc, font_size=26, color=WHITE)
            desc_text.move_to(rect.get_center() + DOWN * 0.45)

            card = VGroup(rect, title_text, desc_text)
            cards.add(card)

        # Arrange with proper spacing
        cards.arrange(RIGHT, buff=0.8)
        cards.move_to(ORIGIN + DOWN * 0.4)

        # Fast stagger
        for card in cards:
            self.play(FadeIn(card, shift=UP * 0.4), run_time=0.35)

        self.wait(0.8)

        # Clear
        self.play(
            *[FadeOut(mob) for mob in [title_group, subtitle, cards]],
            run_time=0.4
        )

    def scene_4_games(self):
        """Scene 4: Show the actual games available"""

        # Title
        title = Text("Classic Arcade Games", font_size=68, weight=BOLD, color=MAGENTA)
        title_glow = title.copy().set_stroke(MAGENTA, width=15, opacity=0.6)
        title_group = VGroup(title_glow, title)
        title_group.to_edge(UP, buff=1.0)

        self.play(FadeIn(title_group, scale=0.95), run_time=0.5)
        self.wait(0.3)

        # Real games from the app
        games = [
            ("Snake", CYAN),
            ("Tetris", GREEN),
            ("Pong", MAGENTA),
            ("Space Invaders", ORANGE),
        ]

        game_cards = VGroup()
        for game_name, color in games:
            # Game card
            rect = RoundedRectangle(
                corner_radius=0.25,
                height=1.8,
                width=3.0,
                stroke_color=color,
                stroke_width=5,
                fill_color=SURFACE_PRIMARY,
                fill_opacity=0.95
            )

            # Game name (large, centered)
            name_text = Text(game_name, font_size=42, color=color, weight=BOLD)
            name_text.move_to(rect.get_center())

            card = VGroup(rect, name_text)
            game_cards.add(card)

        # Arrange in 2x2 grid with proper spacing
        game_cards.arrange_in_grid(rows=2, cols=2, buff=(0.9, 0.7))
        game_cards.move_to(ORIGIN + DOWN * 0.3)

        # Fast stagger reveal
        for card in game_cards:
            self.play(FadeIn(card, scale=0.9), run_time=0.3)

        self.wait(0.8)

        # Clear
        self.play(
            *[FadeOut(mob) for mob in [title_group, game_cards]],
            run_time=0.4
        )

    def scene_5_demo_placeholder(self):
        """Scene 5: Live Demo Placeholder"""

        # Demo title
        demo_title = Text(
            "Live Demo",
            font_size=84,
            weight=BOLD,
            color=CYAN,
            font="Helvetica Neue"
        )
        demo_glow = demo_title.copy().set_stroke(CYAN, width=18, opacity=0.7)
        demo_group = VGroup(demo_glow, demo_title)

        self.play(FadeIn(demo_group, scale=0.9), run_time=0.5)
        self.wait(0.3)

        # Instructions (proper spacing)
        instruction = Text(
            "[ Insert screen recording here ]",
            font_size=36,
            color=MAGENTA,
            font="Courier New"
        ).next_to(demo_group, DOWN, buff=1.2)

        self.play(Write(instruction), run_time=0.5)
        self.wait(0.4)

        # What to show (proper list spacing)
        demo_points = [
            "• Connect wallet",
            "• Play a game",
            "• Zero gas fees",
            "• Instant settlement",
        ]

        points_group = VGroup()
        for point in demo_points:
            point_text = Text(point, font_size=32, color=WHITE)
            points_group.add(point_text)

        points_group.arrange(DOWN, buff=0.5, aligned_edge=LEFT)
        points_group.next_to(instruction, DOWN, buff=1.0)

        for point in points_group:
            self.play(FadeIn(point, shift=RIGHT * 0.2), run_time=0.25)

        self.wait(1.0)

        # Clear
        self.play(
            *[FadeOut(mob) for mob in [demo_group, instruction, points_group]],
            run_time=0.4
        )

    def scene_6_impact(self):
        """Scene 6: The Impact - Real metrics from README"""

        # Title
        title = Text("The Impact", font_size=78, weight=BOLD, color=GREEN)
        title_glow = title.copy().set_stroke(GREEN, width=18, opacity=0.6)
        title_group = VGroup(title_glow, title)
        title_group.to_edge(UP, buff=1.0)

        self.play(FadeIn(title_group, scale=0.95), run_time=0.5)
        self.wait(0.3)

        # Real metrics from the app
        metrics_data = [
            ("$0.00", "Gas Fees", CYAN),
            ("< 1s", "Settlement", GREEN),
            ("70%", "Prize Pool", MAGENTA),
            ("200x", "Cost Reduction", ORANGE),
        ]

        metrics = VGroup()
        for value, label, color in metrics_data:
            # Card (larger, more padding)
            rect = RoundedRectangle(
                corner_radius=0.3,
                height=2.4,
                width=3.2,
                stroke_color=color,
                stroke_width=6,
                fill_color=BG_SECONDARY,
                fill_opacity=0.98
            )

            # Value (huge, bold)
            value_text = Text(value, font_size=80, color=color, weight=BOLD)
            value_text.move_to(rect.get_center() + UP * 0.4)

            # Label (proper spacing)
            label_text = Text(label, font_size=30, color=WHITE)
            label_text.move_to(rect.get_center() + DOWN * 0.5)

            metric = VGroup(rect, value_text, label_text)
            metrics.add(metric)

        # 2x2 grid with generous spacing
        metrics.arrange_in_grid(rows=2, cols=2, buff=(1.0, 0.8))
        metrics.move_to(ORIGIN + DOWN * 0.2)

        # Fast stagger
        for metric in metrics:
            self.play(FadeIn(metric, scale=0.9), run_time=0.3)

        self.wait(0.9)

        # Clear
        self.play(
            *[FadeOut(mob) for mob in [title_group, metrics]],
            run_time=0.4
        )

    def scene_7_closing(self):
        """Scene 7: Closing - Logo, tagline, and CTA"""

        # x402Arcade logo
        logo = Text("x402Arcade", font_size=110, weight=BOLD)
        logo.set_color_by_gradient(CYAN, MAGENTA)
        logo_glow = logo.copy().set_stroke(MAGENTA, width=22, opacity=0.7)
        logo_group = VGroup(logo_glow, logo)

        self.play(FadeIn(logo_group, scale=0.85), run_time=0.7)
        self.wait(0.4)

        # Tagline (proper spacing)
        tagline = Text(
            '"Insert a Penny, Play for Glory"',
            font_size=44,
            color=CYAN,
            weight=BOLD,
            font="Helvetica Neue"
        ).next_to(logo_group, DOWN, buff=1.2)

        self.play(Write(tagline), run_time=0.7)
        self.wait(0.5)

        # Links (proper spacing)
        links = VGroup(
            Text("x402arcade.vercel.app", font_size=36, color=WHITE),
            Text("Built on Cronos zkEVM", font_size=32, color=MAGENTA),
            Text("Powered by x402 Protocol", font_size=32, color=CYAN),
        )
        links.arrange(DOWN, buff=0.6)
        links.next_to(tagline, DOWN, buff=1.2)

        self.play(FadeIn(links, shift=UP * 0.3), run_time=0.6)
        self.wait(1.6)

        # Fade out
        self.play(*[FadeOut(mob) for mob in self.mobjects], run_time=1.0)


if __name__ == "__main__":
    # This allows running with: python x402_demo.py
    import subprocess
    subprocess.run(["manim", "-pql", __file__, "X402Demo"])
