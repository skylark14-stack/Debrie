import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Let's just find where it's broken
idx = content.find('.sub-menu-item {')
idx2 = content.find('.sidebar-header {')

if idx != -1 and idx2 != -1:
    before = content[:idx]
    after = content[idx2:]
    
    fixed_middle = """
.sub-menu-item {
  padding: 0.75rem 1.5rem 0.75rem 3.5rem;
  cursor: pointer;
  color: var(--text-dim);
  font-size: 0.9rem;
  transition: color 0.2s, background 0.2s;
  user-select: none;
}
.sub-menu-item:hover {
  color: var(--blue);
  background: var(--panel-2);
}

.menu-btn {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 50;
  background: var(--blue);
  border: 1px solid var(--blue-dim);
  color: #080B14;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 209, 255, 0.3);
}

.menu-btn:hover {
  background: #7BE1FF;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(79, 209, 255, 0.4);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 330px;
  background-color: var(--panel);
  border-right: 1px solid var(--border);
  z-index: 40;
  padding: 6rem 1.5rem 2rem 1.5rem;
  transform: translateX(-100%);
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 10px 0 30px rgba(0, 0, 0, 0.5);
  overflow-y: auto;
}

.sidebar.open {
  transform: translateX(0);
}

"""
    with open('src/index.css', 'w') as f:
        f.write(before + fixed_middle + after)
    print("Fixed!")
else:
    print("Could not find targets")
