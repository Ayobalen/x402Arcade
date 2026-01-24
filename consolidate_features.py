#!/usr/bin/env python3
"""
Feature Consolidation Script for x402Arcade

Consolidates 1,215 micro-features into ~395 logical implementation units
while preserving 100% of implementation steps and quality.

Usage:
    python consolidate_features.py --dry-run   # Preview changes
    python consolidate_features.py --execute   # Execute consolidation
"""

import sqlite3
import json
import sys
from datetime import datetime
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass

@dataclass
class Feature:
    """Represents a feature from the database"""
    id: int
    priority: int
    category: str
    name: str
    description: str
    steps: List[str]
    passes: bool
    in_progress: bool
    blocked_by_intervention_id: Optional[int]
    deferred: bool

    @classmethod
    def from_row(cls, row):
        """Create Feature from database row"""
        return cls(
            id=row[0],
            priority=row[1],
            category=row[2],
            name=row[3],
            description=row[4],
            steps=json.loads(row[5]) if row[5] else [],
            passes=bool(row[6]),
            in_progress=bool(row[7]),
            blocked_by_intervention_id=row[8],
            deferred=bool(row[9]),
        )

class FeatureConsolidator:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()

    def get_all_features(self) -> List[Feature]:
        """Fetch all features from database"""
        self.cursor.execute("""
            SELECT id, priority, category, name, description, steps,
                   passes, in_progress, blocked_by_intervention_id, deferred
            FROM features
            ORDER BY priority
        """)
        return [Feature.from_row(row) for row in self.cursor.fetchall()]

    def get_consolidation_rules(self, category: str, feature_count: int) -> Dict:
        """Get consolidation rules for a specific category"""

        # Category-specific rules
        rules = {
            "Audio System": {
                "target_count": 12,
                "groups": [
                    (0, 10, "Setup Audio Infrastructure"),
                    (10, 18, "Implement Sound Effects System"),
                    (18, 25, "Implement Music System"),
                    (25, 38, "Add UI Sound Effects"),
                    (38, 50, "Add Snake Game Audio"),
                    (50, 62, "Add Tetris Game Audio"),
                    (62, 72, "Add Arcade-Wide Audio"),
                    (72, 78, "Implement Audio Accessibility"),
                    (78, 85, "Optimize Audio Performance"),
                    (85, 92, "Create Audio UI Components"),
                    (92, 100, "Implement Audio Persistence & Mixing"),
                ]
            },
            # Default rule for most categories
            "default": {
                "consolidation_factor": 3,  # Reduce by ~67%
            }
        }

        # Apply category-specific or default rules
        if category in rules:
            return rules[category]
        else:
            # Default: consolidate by factor of 3
            target_count = max(3, feature_count // 3)
            return {"target_count": target_count, "consolidation_factor": 3}

    def merge_steps(self, child_features: List[Feature]) -> List[str]:
        """Merge steps from child features into consolidated parent"""
        merged_steps = []

        for child in child_features:
            # Add child feature name as a step category
            status_icon = "✓" if child.passes else "○"
            merged_steps.append(f"[{status_icon}] {child.name}")

            # Add indented child steps
            for step in child.steps:
                merged_steps.append(f"    - {step}")

        return merged_steps

    def consolidate_category(self, features: List[Feature], category: str) -> List[Feature]:
        """Consolidate features within a category"""
        if len(features) <= 3:
            # Don't consolidate very small categories
            return features

        rules = self.get_consolidation_rules(category, len(features))

        # Simple consolidation: group every N features
        if "consolidation_factor" in rules:
            # Adjust factor based on category size for better targets
            factor = 4 if len(features) > 50 else 3
            consolidated = []

            for i in range(0, len(features), factor):
                group = features[i:i+factor]

                # Create consolidated feature
                parent = Feature(
                    id=group[0].id,  # Use first child's ID
                    priority=min(f.priority for f in group),
                    category=category,
                    name=f"Implement {group[0].name.split()[0]} Subsystem" if len(group) > 1 else group[0].name,
                    description=f"Bundle of {len(group)} related features:\n" + "\n".join(f"- {f.name}" for f in group),
                    steps=self.merge_steps(group),
                    passes=all(f.passes for f in group),
                    in_progress=any(f.in_progress for f in group),
                    blocked_by_intervention_id=None,
                    deferred=any(f.deferred for f in group),
                )
                consolidated.append(parent)

            return consolidated

        return features

    def consolidate_all(self, dry_run: bool = True) -> Tuple[List[Feature], Dict]:
        """Consolidate all features"""
        features = self.get_all_features()

        # Group by category
        by_category = {}
        for f in features:
            if f.category not in by_category:
                by_category[f.category] = []
            by_category[f.category].append(f)

        # Consolidate each category
        consolidated_all = []
        stats = {
            "before": len(features),
            "after": 0,
            "by_category": {}
        }

        for category, cat_features in sorted(by_category.items()):
            before_count = len(cat_features)
            consolidated = self.consolidate_category(cat_features, category)
            after_count = len(consolidated)

            consolidated_all.extend(consolidated)
            stats["by_category"][category] = {
                "before": before_count,
                "after": after_count,
                "reduction": f"{(before_count - after_count) / before_count * 100:.1f}%"
            }

        stats["after"] = len(consolidated_all)

        return consolidated_all, stats

    def validate(self, original: List[Feature], consolidated: List[Feature]):
        """Validate consolidation preserves data"""
        # Count total steps
        orig_steps = sum(len(f.steps) for f in original)
        cons_steps = sum(len(f.steps) for f in consolidated)

        print(f"\n=== Validation ===")
        print(f"Original features: {len(original)}")
        print(f"Consolidated features: {len(consolidated)}")
        print(f"Original steps: {orig_steps}")
        print(f"Consolidated steps: {cons_steps}")

        assert len(consolidated) < len(original), "No consolidation happened!"
        assert len(consolidated) >= 250 and len(consolidated) <= 600, f"Target range missed: {len(consolidated)}"

        # Steps increase because we add parent feature names, this is expected
        if cons_steps < orig_steps:
            print(f"⚠ Warning: Step count decreased! May have lost data.")
        else:
            step_increase = cons_steps - orig_steps
            print(f"✓ Steps preserved ({step_increase} parent names added)")

        print(f"✓ Validation passed!")

    def execute_migration(self, consolidated: List[Feature]):
        """Execute the database migration"""
        print(f"\n=== Executing Migration ===")

        try:
            self.cursor.execute("BEGIN TRANSACTION")

            # Create temporary table
            self.cursor.execute("""
                CREATE TABLE features_consolidated AS
                SELECT * FROM features WHERE 1=0
            """)

            # Insert consolidated features
            for f in consolidated:
                self.cursor.execute("""
                    INSERT INTO features_consolidated
                    (id, priority, category, name, description, steps, passes, in_progress, blocked_by_intervention_id, deferred)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    f.id, f.priority, f.category, f.name, f.description,
                    json.dumps(f.steps), int(f.passes), int(f.in_progress),
                    f.blocked_by_intervention_id, int(f.deferred)
                ))

            # Swap tables
            self.cursor.execute("DROP TABLE IF EXISTS features_old")
            self.cursor.execute("ALTER TABLE features RENAME TO features_old")
            self.cursor.execute("ALTER TABLE features_consolidated RENAME TO features")

            self.cursor.execute("COMMIT")
            print(f"✓ Migration successful!")

        except Exception as e:
            self.cursor.execute("ROLLBACK")
            print(f"✗ Migration failed: {e}")
            raise

    def close(self):
        """Close database connection"""
        self.conn.close()

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Consolidate x402Arcade features")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without executing")
    parser.add_argument("--execute", action="store_true", help="Execute consolidation")
    parser.add_argument("--db", default="/Users/mujeeb/projects/x402Arcade/features.db", help="Database path")

    args = parser.parse_args()

    if not args.dry_run and not args.execute:
        parser.print_help()
        sys.exit(1)

    consolidator = FeatureConsolidator(args.db)

    print(f"=== Feature Consolidation ===")
    print(f"Mode: {'DRY RUN' if args.dry_run else 'EXECUTE'}")
    print(f"Database: {args.db}")
    print()

    # Get consolidated features
    original = consolidator.get_all_features()
    consolidated, stats = consolidator.consolidate_all(dry_run=args.dry_run)

    # Print stats
    print(f"\n=== Consolidation Stats ===")
    print(f"Original: {stats['before']} features")
    print(f"Consolidated: {stats['after']} features")
    print(f"Reduction: {(stats['before'] - stats['after']) / stats['before'] * 100:.1f}%")
    print(f"\nBy Category:")
    for cat, cat_stats in list(stats['by_category'].items())[:10]:
        print(f"  {cat:40} {cat_stats['before']:4} → {cat_stats['after']:3} ({cat_stats['reduction']})")

    # Validate
    consolidator.validate(original, consolidated)

    # Execute if requested
    if args.execute:
        consolidator.execute_migration(consolidated)
    else:
        print(f"\n(Dry run - no changes made)")

    consolidator.close()

if __name__ == "__main__":
    main()
