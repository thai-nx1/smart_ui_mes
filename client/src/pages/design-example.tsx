import React, { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { 
  OxiiButton, 
  OxiiBadge, 
  OxiiCard, 
  OxiiCardHeader, 
  OxiiCardTitle, 
  OxiiCardDescription, 
  OxiiCardContent,
  OxiiCardFooter,
  OxiiChip,
  OxiiDialog,
  OxiiDialogTrigger,
  OxiiDialogContent,
  OxiiDialogHeader,
  OxiiDialogTitle,
  OxiiDialogDescription,
  OxiiDialogFooter,
  OxiiSearchBar,
  OxiiTabs,
  OxiiTabsList,
  OxiiTabsTrigger,
  OxiiTabsContent,
} from '@/components/ui/oxii-components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Trash, Edit, X, Check, Info, MoreVertical, Star, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DesignExamplePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const toggleChip = (id: string) => {
    setSelectedChips(prev => 
      prev.includes(id) 
        ? prev.filter(chipId => chipId !== id)
        : [...prev, id]
    );
  };

  return (
    <MainLayout title="Oxii Design System">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">Oxii Design System</h1>
          <p className="text-muted-foreground">Một bộ components được thiết kế dựa trên thiết kế Material Design từ Figma với màu chính #00B1D2</p>
        </div>
        
        <OxiiTabs defaultValue="components" className="w-full mb-8">
          <OxiiTabsList>
            <OxiiTabsTrigger value="components">Components</OxiiTabsTrigger>
            <OxiiTabsTrigger value="colors">Colors</OxiiTabsTrigger>
            <OxiiTabsTrigger value="typography">Typography</OxiiTabsTrigger>
          </OxiiTabsList>
          
          <OxiiTabsContent value="components" className="space-y-12 py-4">
            {/* Buttons Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Buttons</h2>
              <div className="flex flex-wrap gap-4 mb-8">
                <OxiiButton>Primary</OxiiButton>
                <OxiiButton variant="secondary">Secondary</OxiiButton>
                <OxiiButton variant="outline">Outline</OxiiButton>
                <OxiiButton variant="ghost">Ghost</OxiiButton>
                <OxiiButton variant="link">Link</OxiiButton>
                <OxiiButton variant="destructive">Destructive</OxiiButton>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <OxiiButton size="sm">Small</OxiiButton>
                <OxiiButton>Default</OxiiButton>
                <OxiiButton size="lg">Large</OxiiButton>
                <OxiiButton size="icon"><Plus className="h-4 w-4" /></OxiiButton>
              </div>
            </section>
            
            {/* Cards Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Cards</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <OxiiCard variant="elevated" hover>
                  <OxiiCardHeader>
                    <OxiiCardTitle>Elevated Card</OxiiCardTitle>
                    <OxiiCardDescription>With hover effect</OxiiCardDescription>
                  </OxiiCardHeader>
                  <OxiiCardContent>
                    <p>This card has an elevation shadow and hover animation effect.</p>
                  </OxiiCardContent>
                  <OxiiCardFooter className="flex justify-between">
                    <OxiiButton variant="ghost" size="sm">Cancel</OxiiButton>
                    <OxiiButton size="sm">Submit</OxiiButton>
                  </OxiiCardFooter>
                </OxiiCard>
                
                <OxiiCard variant="filled">
                  <OxiiCardHeader>
                    <OxiiCardTitle>Filled Card</OxiiCardTitle>
                    <OxiiCardDescription>With subtle background</OxiiCardDescription>
                  </OxiiCardHeader>
                  <OxiiCardContent>
                    <p>This card has a filled background with no elevation.</p>
                  </OxiiCardContent>
                  <OxiiCardFooter>
                    <OxiiButton size="sm" className="w-full">Action</OxiiButton>
                  </OxiiCardFooter>
                </OxiiCard>
                
                <OxiiCard variant="outlined">
                  <OxiiCardHeader>
                    <OxiiCardTitle>Outlined Card</OxiiCardTitle>
                    <OxiiCardDescription>With border only</OxiiCardDescription>
                  </OxiiCardHeader>
                  <OxiiCardContent>
                    <p>This card has only an outline border with no background fill or elevation.</p>
                  </OxiiCardContent>
                  <OxiiCardFooter>
                    <OxiiButton variant="outline" size="sm" className="w-full">Action</OxiiButton>
                  </OxiiCardFooter>
                </OxiiCard>
              </div>
            </section>
            
            {/* Chips & Badges */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Chips & Badges</h2>
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <OxiiChip 
                    label="Default Chip" 
                    selected={selectedChips.includes('default')}
                    onSelect={() => toggleChip('default')}
                  />
                  <OxiiChip 
                    label="Outlined" 
                    variant="outlined"
                    selected={selectedChips.includes('outlined')}
                    onSelect={() => toggleChip('outlined')}
                  />
                  <OxiiChip 
                    label="Filled" 
                    variant="filled"
                    selected={selectedChips.includes('filled')}
                    onSelect={() => toggleChip('filled')}
                  />
                  <OxiiChip 
                    label="With Icon" 
                    icon={<Info className="h-3.5 w-3.5" />}
                    selected={selectedChips.includes('icon')}
                    onSelect={() => toggleChip('icon')}
                  />
                  <OxiiChip 
                    label="Removable" 
                    onSelect={() => toggleChip('removable')}
                    onRemove={() => console.log('removed')}
                    selected={selectedChips.includes('removable')}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <OxiiBadge>Default Badge</OxiiBadge>
                  <OxiiBadge variant="secondary">Secondary</OxiiBadge>
                  <OxiiBadge variant="outline">Outline</OxiiBadge>
                  <OxiiBadge variant="destructive">Destructive</OxiiBadge>
                </div>
              </div>
            </section>
            
            {/* Search & Dialog */}
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Search & Dialog</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Search Variants</h3>
                    <OxiiSearchBar 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClear={() => setSearchQuery('')}
                      placeholder="Search with rounded (default)..."
                      leadingIcon={<Search className="h-4 w-4" />}
                      className="mb-2"
                    />
                    
                    <OxiiSearchBar 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClear={() => setSearchQuery('')}
                      placeholder="Primary variant..."
                      leadingIcon={<Search className="h-4 w-4" />}
                      variant="primary"
                      rounded="lg"
                      className="mb-2"
                    />
                    
                    <OxiiSearchBar 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onClear={() => setSearchQuery('')}
                      placeholder="Ghost variant..."
                      leadingIcon={<Search className="h-4 w-4" />}
                      variant="ghost"
                      rounded="md"
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Dialog Example</h3>
                    <OxiiDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <OxiiDialogTrigger asChild>
                        <OxiiButton>Open Dialog</OxiiButton>
                      </OxiiDialogTrigger>
                      <OxiiDialogContent>
                        <OxiiDialogHeader>
                          <OxiiDialogTitle>Material Design Dialog</OxiiDialogTitle>
                          <OxiiDialogDescription>
                            This is a dialog component styled based on Material Design guidelines.
                          </OxiiDialogDescription>
                        </OxiiDialogHeader>
                        <div className="p-6">
                          <p>Dialog content goes here. You can add any content in this section.</p>
                        </div>
                        <OxiiDialogFooter>
                          <OxiiButton variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                          </OxiiButton>
                          <OxiiButton onClick={() => setDialogOpen(false)}>
                            Confirm
                          </OxiiButton>
                        </OxiiDialogFooter>
                      </OxiiDialogContent>
                    </OxiiDialog>
                  </div>
                </div>
              </div>
            </section>
          </OxiiTabsContent>
          
          <OxiiTabsContent value="colors" className="py-4">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Color Palette</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <ColorSwatch name="Primary" color="var(--oxii-primary)" textColor="white" />
                <ColorSwatch name="Primary 80%" color="var(--oxii-primary-80)" textColor="white" />
                <ColorSwatch name="Primary 60%" color="var(--oxii-primary-60)" textColor="white" />
                <ColorSwatch name="Primary 40%" color="var(--oxii-primary-40)" textColor="black" />
                <ColorSwatch name="Primary 20%" color="var(--oxii-primary-20)" textColor="black" />
                <ColorSwatch name="Primary 10%" color="var(--oxii-primary-10)" textColor="black" />
                <ColorSwatch name="Primary Dark" color="var(--oxii-primary-dark)" textColor="white" />
                <ColorSwatch name="Primary Light" color="var(--oxii-primary-light)" textColor="black" />
                <ColorSwatch name="Secondary" color="var(--oxii-secondary)" textColor="black" />
                <ColorSwatch name="Secondary Variant" color="var(--oxii-secondary-variant)" textColor="white" />
                <ColorSwatch name="Error" color="var(--oxii-error)" textColor="white" />
                <ColorSwatch name="Surface" color="var(--oxii-surface)" textColor="black" border />
                <ColorSwatch name="Background" color="var(--oxii-background)" textColor="black" border />
              </div>
            </section>
          </OxiiTabsContent>
          
          <OxiiTabsContent value="typography" className="py-4">
            <section>
              <h2 className="text-2xl font-semibold mb-4">Typography</h2>
              <div className="space-y-10">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Headings</h3>
                  <div className="space-y-4 border-l-4 border-primary pl-4">
                    <div>
                      <h1 className="text-5xl font-bold">Heading 1</h1>
                      <p className="text-sm text-muted-foreground">text-5xl font-bold</p>
                    </div>
                    <div>
                      <h2 className="text-4xl font-semibold">Heading 2</h2>
                      <p className="text-sm text-muted-foreground">text-4xl font-semibold</p>
                    </div>
                    <div>
                      <h3 className="text-3xl font-semibold">Heading 3</h3>
                      <p className="text-sm text-muted-foreground">text-3xl font-semibold</p>
                    </div>
                    <div>
                      <h4 className="text-2xl font-medium">Heading 4</h4>
                      <p className="text-sm text-muted-foreground">text-2xl font-medium</p>
                    </div>
                    <div>
                      <h5 className="text-xl font-medium">Heading 5</h5>
                      <p className="text-sm text-muted-foreground">text-xl font-medium</p>
                    </div>
                    <div>
                      <h6 className="text-lg font-medium">Heading 6</h6>
                      <p className="text-sm text-muted-foreground">text-lg font-medium</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Body Text</h3>
                  <div className="space-y-4 border-l-4 border-primary pl-4">
                    <div>
                      <p className="text-base">Body Text (Default)</p>
                      <p className="text-sm text-muted-foreground">text-base</p>
                    </div>
                    <div>
                      <p className="text-sm">Small Text</p>
                      <p className="text-sm text-muted-foreground">text-sm</p>
                    </div>
                    <div>
                      <p className="text-xs">Extra Small Text</p>
                      <p className="text-sm text-muted-foreground">text-xs</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Font Weights</h3>
                  <div className="space-y-4 border-l-4 border-primary pl-4">
                    <div>
                      <p className="text-lg font-light">Font Light</p>
                      <p className="text-sm text-muted-foreground">font-light</p>
                    </div>
                    <div>
                      <p className="text-lg font-normal">Font Normal</p>
                      <p className="text-sm text-muted-foreground">font-normal</p>
                    </div>
                    <div>
                      <p className="text-lg font-medium">Font Medium</p>
                      <p className="text-sm text-muted-foreground">font-medium</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Font Semibold</p>
                      <p className="text-sm text-muted-foreground">font-semibold</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">Font Bold</p>
                      <p className="text-sm text-muted-foreground">font-bold</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </OxiiTabsContent>
        </OxiiTabs>
      </div>
    </MainLayout>
  );
}

interface ColorSwatchProps {
  name: string;
  color: string;
  textColor: 'white' | 'black';
  border?: boolean;
}

function ColorSwatch({ name, color, textColor, border = false }: ColorSwatchProps) {
  return (
    <div className={cn(
      "rounded-lg overflow-hidden shadow-sm",
      border && "border"
    )}>
      <div 
        className="h-24 flex items-end p-2" 
        style={{ backgroundColor: color, color: textColor === 'white' ? 'white' : 'black' }}
      >
        <span className="text-sm font-medium drop-shadow-sm">{name}</span>
      </div>
      <div className="p-2 text-xs bg-background">
        <div className="font-mono">{color}</div>
      </div>
    </div>
  );
}