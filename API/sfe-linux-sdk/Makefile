CXX = g++
CXXFLAGS = -O3 -Wall -std=c++11

all: sfe_cli

sfe_cli: sfe_cli.cpp
	$(CXX) $(CXXFLAGS) -ldl -o sfe_cli sfe_cli.cpp

clean:
	rm -f sfe_cli
