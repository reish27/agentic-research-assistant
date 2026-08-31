from agents.tester import test_code


print("=" * 60)
print("AGENT 3 — MULTI-LANGUAGE TEST")
print("=" * 60)


# ============================================================
# TEST 1 — PYTHON
# ============================================================

python_code = """
import sys

def main():
    n = int(sys.stdin.readline())
    arr = list(map(int, sys.stdin.readline().split()))

    distinct = set(arr)

    if len(distinct) < 2:
        print("None")
        return

    distinct.remove(max(distinct))
    print(max(distinct))


if __name__ == "__main__":
    main()
"""


print("\nTEST 1 — PYTHON")
print("-" * 60)

result = test_code(
    problem="Write a Python program to find the second largest distinct number in an array.",
    language="Python",
    code=python_code
)

print(result)


# ============================================================
# TEST 2 — C++
# ============================================================

cpp_code = """
#include <bits/stdc++.h>
using namespace std;

int main() {
    int n;
    cin >> n;

    set<int> values;

    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        values.insert(x);
    }

    if (values.size() < 2) {
        cout << "None\\n";
        return 0;
    }

    auto it = values.rbegin();
    ++it;

    cout << *it << "\\n";

    return 0;
}
"""


print("\nTEST 2 — C++")
print("-" * 60)

result = test_code(
    problem="Write a C++ program to find the second largest distinct number in an array.",
    language="C++",
    code=cpp_code
)

print(result)


# ============================================================
# TEST 3 — JAVA
# ============================================================

java_code = """
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int n = sc.nextInt();

        TreeSet<Integer> values = new TreeSet<>();

        for (int i = 0; i < n; i++) {
            values.add(sc.nextInt());
        }

        if (values.size() < 2) {
            System.out.println("None");
            return;
        }

        values.pollLast();

        System.out.println(values.last());
    }
}
"""


print("\nTEST 3 — JAVA")
print("-" * 60)

result = test_code(
    problem="Write a Java program to find the second largest distinct number in an array.",
    language="Java",
    code=java_code
)

print(result)