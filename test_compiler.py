from agents.compiler import compile_code


print("=" * 60)
print("AGENT 4 — COMPILER TEST")
print("=" * 60)


# ============================================================
# TEST 1 — PYTHON
# ============================================================

python_code = """
n = int(input())
print(n * 2)
"""

print("\nTEST 1 — PYTHON")
print("-" * 60)

result = compile_code(
    python_code,
    "Python"
)

print(result)


# ============================================================
# TEST 2 — C++
# ============================================================

cpp_code = """
#include <iostream>
using namespace std;

int main() {
    int n;
    cin >> n;
    cout << n * 2 << endl;
    return 0;
}
"""

print("\nTEST 2 — C++")
print("-" * 60)

result = compile_code(
    cpp_code,
    "C++"
)

print(result)


# ============================================================
# TEST 3 — JAVA
# ============================================================

java_code = """
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        System.out.println(n * 2);
    }
}
"""

print("\nTEST 3 — JAVA")
print("-" * 60)

result = compile_code(
    java_code,
    "Java"
)

print(result)


print("\n" + "=" * 60)
print("END OF AGENT 4 TEST")
print("=" * 60)