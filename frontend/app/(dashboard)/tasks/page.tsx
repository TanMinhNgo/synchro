'use client';

import * as React from 'react';
import { BoardColumn } from '@/components/organisms/BoardColumn';
import { TaskCard } from '@/components/molecules/TaskCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, List, AlignJustify, Kanban, CheckCircle2, Clock, PlayCircle, Eye } from 'lucide-react';

export default function MyTasksPage() {
    return (
        <div className="flex h-full flex-col gap-6 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {/* Task Calendar Section */}
            <Card className="shrink-0 p-4 flex flex-col gap-4 border-black/5 shadow-sm rounded-2xl mx-2 mt-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Task Calendar</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground border rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>

                {/* Fake Timeline Calendar */}
                <div className="relative h-63 shrink-0 w-full border-t border-b overflow-hidden flex flex-col bg-white">
                    {/* Header Dates */}
                    <div className="grid grid-cols-8 w-full text-center text-[13px] font-medium text-muted-foreground mt-4 mb-2 z-10">
                        <span>11 Feb</span>
                        <span>12 Feb</span>
                        <span>13 Feb</span>
                        <span className="text-foreground font-bold">14 Feb</span>
                        <span>15 Feb</span>
                        <span>16 Feb</span>
                        <span>17 Feb</span>
                        <span>18 Feb</span>
                    </div>

                    <div className="relative flex-1 w-full border-t">
                        <div className="absolute inset-0 grid grid-cols-8">
                            {/* 11 Feb */}
                            <div className="border-l border-black/5 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 bg-[#F4F4F5] text-[#4d4d4d] text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '30px' }}>
                                    <span className="font-semibold text-foreground">11 Feb</span> Submit Final Screens
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 bg-[#F4F4F5] text-[#4d4d4d] text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '75px' }}>
                                    <span className="font-semibold text-foreground">11 Feb</span> Client Feedback
                                </div>

                                {/* 10 Feb (cut off on the left like the reference) */}
                                <div className="absolute left-1/2 -translate-x-[140%] bg-[#F4F4F5] text-muted-foreground text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '120px' }}>
                                    <span className="font-semibold text-foreground">10 Feb</span> Draft Client Proposal
                                </div>
                            </div>

                            {/* 12 Feb */}
                            <div className="border-l border-black/5 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 bg-[#F4F4F5] text-[#4d4d4d] text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '120px' }}>
                                    <span className="font-semibold text-foreground">12 Feb</span> Client Feedback Meeting
                                </div>
                            </div>

                            {/* 13 Feb */}
                            <div className="border-l border-black/5 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 bg-[#F4F4F5] text-[#4d4d4d] text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '75px' }}>
                                    <span className="font-semibold text-foreground">13 Feb</span> UI Testing
                                </div>
                            </div>

                            {/* 14 Feb */}
                            <div className="border-l border-black/5 relative">
                                {/* Solid divider + handle inside the 14 Feb column center */}
                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-foreground z-10">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
                                    <div className="absolute top-15.5 left-1/2 -translate-x-1/2 w-2 h-3.5 bg-white border border-foreground rounded-xs flex flex-col justify-center items-center gap-0.5 shadow-sm cursor-pointer">
                                        <div className="w-0.75 h-px bg-foreground/60" />
                                        <div className="w-0.75 h-px bg-foreground/60" />
                                    </div>
                                </div>

                                {/* Black pill sits to the RIGHT of the marker line */}
                                <div className="absolute left-1/2 translate-x-6 bg-[#18181A] text-white text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-md whitespace-nowrap z-20" style={{ top: '55px' }}>
                                    <span className="font-semibold text-white/90">14 Feb</span> Prototype Testing
                                </div>
                            </div>

                            {/* 15 Feb */}
                            <div className="border-l border-black/5 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 bg-[#F4F4F5] text-[#4d4d4d] text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '120px' }}>
                                    <span className="font-semibold text-foreground">15 Feb</span> Finalize UI Screens
                                </div>
                            </div>

                            {/* 16 Feb (striped column) */}
                            <div className="border-l border-black/5 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 8px)' }} />
                            </div>

                            {/* 17 Feb */}
                            <div className="border-l border-black/5 relative">
                                <div className="absolute left-1/2 -translate-x-1/2 bg-[#F4F4F5] text-[#4d4d4d] text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap" style={{ top: '75px' }}>
                                    <span className="font-semibold text-foreground">17 Feb</span> Update Style
                                </div>
                            </div>

                            {/* 18 Feb */}
                            <div className="border-l border-r border-black/5 relative" />
                        </div>
                    </div>
                </div>
            </Card>

            {/* All Task Section */}
            <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between px-4">
                    <h2 className="text-lg font-semibold tracking-tight">All Task</h2>
                    <div className="flex items-center bg-muted/50 p-1 rounded-xl">
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 rounded-lg px-3 text-xs">
                            <AlignJustify className="h-3.5 w-3.5 mr-2" />
                            Spreadsheet
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 rounded-lg px-3 text-xs">
                            <List className="h-3.5 w-3.5 mr-2" />
                            Timeline
                        </Button>
                        <Button variant="ghost" size="sm" className="bg-white shadow-sm h-8 rounded-lg px-3 font-semibold text-xs">
                            <Kanban className="h-3.5 w-3.5 mr-2" />
                            Kanban
                            <Badge className="ml-2 bg-muted text-muted-foreground hover:bg-muted font-normal h-4 text-[10px] px-1 rounded-sm border-none">00</Badge>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2 flex-1 pb-4">
                    <BoardColumn
                        title="To-do"
                        count={4}
                        icon={<Clock className="h-3.5 w-3.5 text-foreground" />}
                        iconBgColor="bg-white shadow-sm"
                    >
                        <TaskCard
                            projectTitle="ABC Dashboard"
                            date="Feb 14, 2027"
                            title="Create Wireframe"
                            progress={0}
                            comments={3}
                            links={2}
                            assignees={[{ name: 'A', avatarUrl: 'https://i.pravatar.cc/150?img=5' }, { name: 'B', avatarUrl: 'https://i.pravatar.cc/150?img=6' }]}
                        />
                        <TaskCard
                            projectTitle="Twinkle Website"
                            date="Feb 14, 2027"
                            title="Client Feedback"
                            progress={10}
                            assignees={[{ name: 'C', avatarUrl: 'https://i.pravatar.cc/150?img=7' }]}
                        />
                    </BoardColumn>

                    <BoardColumn
                        title="In Progress"
                        count={5}
                        icon={<PlayCircle className="h-3.5 w-3.5 text-blue-600" />}
                        iconBgColor="bg-blue-100"
                        titleColor="text-blue-600"
                    >
                        <TaskCard
                            projectTitle="Sinen Dashboard"
                            date="Feb 14, 2027"
                            title="UI Testing"
                            progress={25}
                            comments={14}
                            links={4}
                            assignees={[{ name: 'D', avatarUrl: 'https://i.pravatar.cc/150?img=8' }, { name: 'E', avatarUrl: 'https://i.pravatar.cc/150?img=9' }]}
                        />
                    </BoardColumn>

                    <BoardColumn
                        title="In Review"
                        count={3}
                        icon={<Eye className="h-3.5 w-3.5 text-orange-600" />}
                        iconBgColor="bg-orange-100"
                        titleColor="text-orange-600"
                    >
                        <TaskCard
                            projectTitle="Twinkle Website"
                            date="Feb 14, 2027"
                            title="Update Style"
                            progress={55}
                            comments={7}
                            links={1}
                            assignees={[{ name: 'F', avatarUrl: 'https://i.pravatar.cc/150?img=10' }, { name: 'G', avatarUrl: 'https://i.pravatar.cc/150?img=11' }]}
                        />
                        <TaskCard
                            projectTitle="Sosro Mobile App"
                            date="Feb 14, 2027"
                            title="Create Hi-Fi Design"
                            progress={80}
                            assignees={[{ name: 'H', avatarUrl: 'https://i.pravatar.cc/150?img=12' }]}
                        />
                    </BoardColumn>

                    <BoardColumn
                        title="Completed"
                        count={4}
                        icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        iconBgColor="bg-emerald-100"
                        titleColor="text-emerald-600"
                    >
                        <TaskCard
                            projectTitle="ABC Dashboard"
                            date="Feb 14, 2027"
                            title="Create Wireframe"
                            progress={100}
                            comments={3}
                            links={2}
                            assignees={[{ name: 'I', avatarUrl: 'https://i.pravatar.cc/150?img=13' }, { name: 'J', avatarUrl: 'https://i.pravatar.cc/150?img=14' }]}
                        />
                        <TaskCard
                            projectTitle="ABC Dashboard"
                            date="Feb 14, 2027"
                            title="Client Feedback"
                            progress={100}
                            assignees={[{ name: 'K', avatarUrl: 'https://i.pravatar.cc/150?img=15' }]}
                        />
                    </BoardColumn>
                </div>
            </div>
        </div>
    );
}
