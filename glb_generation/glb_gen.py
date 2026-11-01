"""
Generates a donut.glb file: a smooth torus-shaped donut (tan dough) with a
separate blue frosting layer draped on top, yellow/blue/red/orange sprinkles
with rounded (hemisphere-capped) ends, and a bite taken out of one side.

Requirements:
    pip install trimesh numpy manifold3d

Usage:
    python glb_gen.py
"""

import os
import numpy as np
import trimesh

OUTPUT_FILENAME = "donut.glb"

# Torus (donut) dimensions, in meters.
MAJOR_RADIUS = 0.045  # distance from the donut's center to the tube's center
MINOR_RADIUS = 0.025  # dough tube thickness radius
MAJOR_SECTIONS = 160  # high resolution -> smooth, not polygon-ish
MINOR_SECTIONS = 80

DOUGH_COLOR = [216, 170, 110, 255]  # tan

FROSTING_COLOR = [30, 100, 210, 255]  # blue frosting
FROSTING_THICKNESS = 0.007  # how far the frosting bulges above the dough
FROSTING_LIFT = 0.0006  # tiny gap so the frosting sits visibly on top, not merged in
FROSTING_HALF_WIDTH_BASE = 1.05  # base half-angle (radians) of frosting coverage around the top
FROSTING_U_SECTIONS = 160
FROSTING_V_SECTIONS = 20

SPRINKLE_COLORS = {
    "yellow": [250, 210, 40, 255],
    "blue": [40, 90, 220, 255],
    "red": [220, 40, 40, 255],
    "orange": [240, 130, 30, 255],
}
NUM_SPRINKLES = 90
SPRINKLE_RADIUS = 0.0016
SPRINKLE_LENGTH = 0.006  # length of the cylindrical middle section (ends get hemisphere caps)
SPRINKLE_LIFT = 0.0008  # sit slightly above the frosting surface

# The bite is carved out of the donut's outer-top edge at u = 0.
BITE_RADIUS = 0.014
BITE_U_HALF_ANGLE = 0.45  # angular region (around u=0) excluded from frosting/sprinkles

RNG_SEED = 7


def torus_point_and_normal(u, v):
    """Surface point and outward normal of the base dough torus at (u, v)."""
    cos_u, sin_u = np.cos(u), np.sin(u)
    cos_v, sin_v = np.cos(v), np.sin(v)

    point = np.array([
        (MAJOR_RADIUS + MINOR_RADIUS * cos_v) * cos_u,
        (MAJOR_RADIUS + MINOR_RADIUS * cos_v) * sin_u,
        MINOR_RADIUS * sin_v,
    ])
    normal = np.array([cos_v * cos_u, cos_v * sin_u, sin_v])
    normal /= np.linalg.norm(normal)
    return point, normal


def bite_center():
    """World-space center of the sphere used to carve the bite mark."""
    point, normal = torus_point_and_normal(0.0, np.pi / 3)
    return point + normal * (BITE_RADIUS * 0.35)


def angular_distance(u, center):
    diff = (u - center + np.pi) % (2 * np.pi) - np.pi
    return abs(diff)


def build_dough_mesh():
    """Builds a smooth, high-resolution torus and carves a bite out of it."""
    u = np.linspace(0, 2 * np.pi, MAJOR_SECTIONS, endpoint=False)
    v = np.linspace(0, 2 * np.pi, MINOR_SECTIONS, endpoint=False)
    uu, vv = np.meshgrid(u, v, indexing="ij")

    x = (MAJOR_RADIUS + MINOR_RADIUS * np.cos(vv)) * np.cos(uu)
    y = (MAJOR_RADIUS + MINOR_RADIUS * np.cos(vv)) * np.sin(uu)
    z = MINOR_RADIUS * np.sin(vv)

    vertices = np.column_stack([x.ravel(), y.ravel(), z.ravel()])

    def idx(i, j):
        return (i % MAJOR_SECTIONS) * MINOR_SECTIONS + (j % MINOR_SECTIONS)

    faces = []
    for i in range(MAJOR_SECTIONS):
        for j in range(MINOR_SECTIONS):
            a = idx(i, j)
            b = idx(i + 1, j)
            c = idx(i + 1, j + 1)
            d = idx(i, j + 1)
            faces.append([a, b, c])
            faces.append([a, c, d])

    mesh = trimesh.Trimesh(vertices=vertices, faces=np.array(faces), process=True)
    mesh.fix_normals()

    bite_sphere = trimesh.creation.icosphere(subdivisions=3, radius=BITE_RADIUS)
    bite_sphere.apply_translation(bite_center())

    bitten = trimesh.boolean.difference([mesh, bite_sphere], engine="manifold")
    bitten.fix_normals()
    bitten.visual.face_colors = np.array(DOUGH_COLOR, dtype=np.uint8)

    return bitten


def frosting_thickness_profile(t):
    """0 at the edges (t=0/1), smoothly rounded and thickest in the middle."""
    return np.sin(np.clip(t, 0, 1) * np.pi) ** 0.6


def build_frosting_mesh(rng):
    """A separate rounded blob of frosting draped over the top of the donut,
    with a drippy, irregular bottom edge, leaving a gap where the bite is."""
    u_samples = np.linspace(0, 2 * np.pi, FROSTING_U_SECTIONS, endpoint=False)
    # Exclude the angular range covered by the bite so frosting doesn't float over it.
    keep_mask = angular_distance(u_samples, 0.0) > BITE_U_HALF_ANGLE
    u_samples = u_samples[keep_mask]
    u_count = len(u_samples)

    # Smooth per-u drip variation (a few random low-frequency harmonics).
    harmonics = rng.uniform(0.3, 1.0, size=4)
    phases = rng.uniform(0, 2 * np.pi, size=4)
    drip = np.zeros(u_count)
    for k in range(1, 5):
        drip += harmonics[k - 1] * np.sin(k * u_samples + phases[k - 1])
    drip = 0.25 * drip / np.max(np.abs(drip))
    half_width = FROSTING_HALF_WIDTH_BASE + drip  # radians, varies per u

    t_samples = np.linspace(0.0, 1.0, FROSTING_V_SECTIONS)

    inner_grid = np.zeros((u_count, FROSTING_V_SECTIONS, 3))
    outer_grid = np.zeros((u_count, FROSTING_V_SECTIONS, 3))

    for i, u in enumerate(u_samples):
        v_lo = np.pi / 2 - half_width[i]
        v_hi = np.pi / 2 + half_width[i]
        for j, t in enumerate(t_samples):
            v = v_lo + t * (v_hi - v_lo)
            point, normal = torus_point_and_normal(u, v)
            inner = point + normal * FROSTING_LIFT
            thickness = FROSTING_THICKNESS * frosting_thickness_profile(t)
            outer = inner + normal * thickness
            inner_grid[i, j] = inner
            outer_grid[i, j] = outer

    vertices = []
    faces = []

    def add_grid(grid, flip=False):
        base = len(vertices)
        rows, cols = grid.shape[0], grid.shape[1]
        vertices.extend(grid.reshape(-1, 3))
        for i in range(rows - 1):
            for j in range(cols - 1):
                a = base + i * cols + j
                b = base + (i + 1) * cols + j
                c = base + (i + 1) * cols + (j + 1)
                d = base + i * cols + (j + 1)
                if not flip:
                    faces.append([a, b, c])
                    faces.append([a, c, d])
                else:
                    faces.append([a, c, b])
                    faces.append([a, d, c])
        return base

    # Outer (visible, bulging) surface.
    add_grid(outer_grid, flip=False)

    # End caps closing the two open ends left by the bite gap.
    def add_end_cap(i_index, flip):
        base = len(vertices)
        vertices.extend(inner_grid[i_index])
        vertices.extend(outer_grid[i_index])
        cols = FROSTING_V_SECTIONS
        for j in range(cols - 1):
            a = base + j
            b = base + j + 1
            c = base + cols + j + 1
            d = base + cols + j
            if not flip:
                faces.append([a, b, c])
                faces.append([a, c, d])
            else:
                faces.append([a, c, b])
                faces.append([a, d, c])

    add_end_cap(0, flip=True)
    add_end_cap(u_count - 1, flip=False)

    frosting = trimesh.Trimesh(vertices=np.array(vertices), faces=np.array(faces), process=True)
    frosting.fix_normals()
    frosting.visual.face_colors = np.array(FROSTING_COLOR, dtype=np.uint8)

    return frosting, u_samples, half_width


def build_sprinkles(rng, u_samples, half_width):
    """Scatters small capsule-shaped (rounded/hemisphere-ended) sprinkles
    across the frosting's outer surface."""
    sprinkles = []
    color_choices = list(SPRINKLE_COLORS.values())
    bcenter = bite_center()

    count = 0
    attempts = 0
    while count < NUM_SPRINKLES and attempts < NUM_SPRINKLES * 20:
        attempts += 1
        i = rng.integers(0, len(u_samples))
        u = u_samples[i]
        t = rng.uniform(0.1, 0.85)
        v_lo = np.pi / 2 - half_width[i]
        v_hi = np.pi / 2 + half_width[i]
        v = v_lo + t * (v_hi - v_lo)

        point, normal = torus_point_and_normal(u, v)
        thickness = FROSTING_THICKNESS * frosting_thickness_profile(t)
        surface_point = point + normal * (FROSTING_LIFT + thickness)

        if np.linalg.norm(surface_point - bcenter) < BITE_RADIUS * 1.1:
            continue

        # Tangent directions on the surface, used to lay the sprinkle flat.
        arbitrary = np.array([0.0, 0.0, 1.0]) if abs(normal[2]) < 0.9 else np.array([1.0, 0.0, 0.0])
        tangent1 = np.cross(normal, arbitrary)
        tangent1 /= np.linalg.norm(tangent1)
        tangent2 = np.cross(normal, tangent1)

        angle = rng.uniform(0, 2 * np.pi)
        direction = np.cos(angle) * tangent1 + np.sin(angle) * tangent2

        # capsule() is already centered at the origin, spanning along z from
        # -(height/2 + radius) to +(height/2 + radius) -- i.e. a cylinder with
        # a hemisphere cap on each end.
        capsule = trimesh.creation.capsule(
            radius=SPRINKLE_RADIUS, height=SPRINKLE_LENGTH, count=[8, 8]
        )
        rotation = trimesh.geometry.align_vectors([0, 0, 1], direction)
        capsule.apply_transform(rotation)
        capsule.apply_translation(surface_point + normal * SPRINKLE_LIFT)

        color = color_choices[rng.integers(0, len(color_choices))]
        capsule.visual.face_colors = np.array(color, dtype=np.uint8)

        sprinkles.append(capsule)
        count += 1

    return sprinkles


def main():
    rng = np.random.default_rng(RNG_SEED)

    dough = build_dough_mesh()
    frosting, u_samples, half_width = build_frosting_mesh(rng)
    sprinkles = build_sprinkles(rng, u_samples, half_width)

    combined = trimesh.util.concatenate([dough, frosting] + sprinkles)

    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), OUTPUT_FILENAME)
    combined.export(output_path)
    print(f"Donut GLB written to: {output_path}")


if __name__ == "__main__":
    main()
