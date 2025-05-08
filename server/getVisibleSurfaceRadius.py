
from decimal import Decimal, getcontext
import math
import sys
import json

# Set the precision for decimal calculations
getcontext().prec = 10

def calculate_hypotenuse(altitude, halved_field_of_view):
    """Calculates the hypotenuse of a right triangle using Decimal for
       precision. Arguments must be passed as strings to avoid the imprecisions
       resulting from representing numbers as floats.

    Args:
        altitude: The length of the adjacent leg as a string.
        halved_field_of_view: The angle in degrees between the adjacent leg
        (altitude) and the hypotenuse as a string.

    Returns:
        The length of the hypotenuse as a Decimal, or None if the angle is
        invalid or input is not a valid number.
    """
    try:
        adjacent_length = Decimal(altitude)
        angle_degrees = Decimal(halved_field_of_view)
    except:
        print("Error: Invalid numeric input.")
        return None

    if not (Decimal('0') < angle_degrees < Decimal('90')):
        print("Error: Angle must be greater than 0 and less than 90 degrees for a valid right triangle.")
        return None

    angle_radians = angle_degrees * Decimal(math.pi) / Decimal('180')

    try:
        # TODO: this temporarily converts back to floating point. Replace Decimal with better trig library
        cos_angle = Decimal(math.cos(float(angle_radians)))
        hypotenuse = adjacent_length / cos_angle
        return hypotenuse
    except:
        print("Error during calculation.")
        return None

def calculate_smaller_angle(side1_str, side2_str, angle_degrees_str):
    """
    Calculates the the smaller of the two remaining angles.

    Args:
        side1_str: The length of the first side as a string.
        side2_str: The length of the second side as a string.
        angle_degrees_str: The angle (in degrees) between the two sides as a string.

    Returns:
        - The smaller of the two remaining angles in degrees as a Decimal, or None if the input is invalid.
    """
    try:
        side1 = Decimal(side1_str)
        side2 = Decimal(side2_str)
        angle_degrees = Decimal(angle_degrees_str)
    except:
        print("Error: Invalid numeric input. Please enter numbers.")
        return None

    if not (0 <= angle_degrees <= 180):
        print("Error: Angle must be between 0 and 180 degrees (inclusive) for a valid triangle.")
        return None

    angle_radians = angle_degrees * Decimal(math.pi) / Decimal('180')
    # Law of Cosines: c^2 = a^2 + b^2 - 2ab*cos(C)
    try:
        third_side_squared = (side1 ** 2) + (side2 ** 2) - 2 * side1 * side2 * Decimal(math.cos(float(angle_radians)))
        # Ensure the value inside the sqrt is not negative due to potential rounding errors
        if third_side_squared < 0:
            third_side_squared = 0  # Consider it a very small value close to 0
        third_side = third_side_squared.sqrt()

        # Calculate the other two angles using the Law of Cosines
        angle_a_rad = Decimal(math.acos(float((side2 ** 2 + third_side ** 2 - side1 ** 2) / (2 * side2 * third_side))))
        angle_b_rad = Decimal(math.acos(float((side1 ** 2 + third_side ** 2 - side2 ** 2) / (2 * side1 * third_side))))

        angle_a_deg = angle_a_rad * Decimal('180') / Decimal(math.pi)
        angle_b_deg = angle_b_rad * Decimal('180') / Decimal(math.pi)

        smaller_angle = min(angle_a_deg, angle_b_deg)
        return smaller_angle
    except:
        print("Error during calculation.")
        return None

def calculate_arc_length(radius_str, central_angle_degrees_str):
    """
    Calculates the arc length of a circle given the radius and central angle.

    Args:
        radius_str: The radius of the circle as a string.
        central_angle_degrees_str: The central angle in degrees as a string.

    Returns:
        The arc length as a Decimal, or None if the input is invalid.
    """
    try:
        radius = Decimal(radius_str)
        central_angle_degrees = Decimal(central_angle_degrees_str)
    except:
        print("Error: Invalid numeric input. Please enter numbers.")
        return None

    if radius < 0:
        print("Error: Radius must be non-negative.")
        return None

    # Convert the central angle from degrees to radians.
    central_angle_radians = central_angle_degrees * Decimal(math.pi) / Decimal('180')

    # Arc length formula: arc_length = radius * central_angle_in_radians
    arc_length = radius * central_angle_radians
    return arc_length


def main():
    """
    Given an altitude and field of view, calculates the radius of the visible
    surface of a sphere.
    """
    # Read input from stdin
    input_data = sys.stdin.readline().strip()

    try:
        data = json.loads(input_data)
        altitude = Decimal(data["altitude"])
        fov = data["fov"]
    except json.JSONDecodeError:
        print(json.dumps({"error": "Invalid JSON input"}))
        return
    except KeyError as e:
        print(json.dumps({"error": f"Missing key: {e}"}))
        return
    
    try:
        earth_radius = Decimal(6378137)
        half_fov = Decimal(fov)/Decimal(2)

        hypotenuse = calculate_hypotenuse(altitude, half_fov)

        earth_center_angle = calculate_smaller_angle(altitude+earth_radius, hypotenuse, half_fov)

        visible_radius = calculate_arc_length(earth_radius, earth_center_angle)
        print(json.dumps({"visible_radius": str(visible_radius)}))

    except Exception as e:
        # Print any errors as JSON
        print(json.dumps({"error": str(e)}))
        return
        
if __name__ == "__main__":
    main()